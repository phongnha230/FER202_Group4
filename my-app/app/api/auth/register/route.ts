import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

type RegisterBody = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegisterBody;
    const name = body.name?.trim() ?? '';
    const email = body.email?.trim().toLowerCase() ?? '';
    const password = body.password ?? '';
    const confirmPassword = body.confirmPassword ?? '';

    if (!name || !email || !password || !confirmPassword) {
      return NextResponse.json(
        { error: 'Please fill in all required fields.' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: name,
      },
    });

    if (error || !data.user) {
      return NextResponse.json(
        { error: error?.message || 'Unable to create account.' },
        { status: 400 }
      );
    }

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert(
        {
          id: data.user.id,
          full_name: name,
          role: 'customer',
        },
        { onConflict: 'id' }
      );

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(data.user.id);

      return NextResponse.json(
        { error: profileError.message || 'Unable to create profile.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Unexpected server error.',
      },
      { status: 500 }
    );
  }
}
