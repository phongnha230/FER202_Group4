'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface VariantSelectorProps {
    variants: string[];
    type: 'color' | 'size';
    selected: string;
    onSelect: (value: string) => void;
}

export default function VariantSelector({ variants, type, selected, onSelect }: VariantSelectorProps) {
    if (!variants?.length) return null;

    return (
        <div className="mb-6">
            <h3 className="text-sm font-medium uppercase tracking-wide mb-3 text-gray-900">
                {type}: <span className="text-gray-500 font-normal normal-case">{selected}</span>
            </h3>
            <div className="flex flex-wrap gap-3">
                {variants.map((variant) => {
                    const isSelected = selected === variant;

                    if (type === 'color') {
                        // Map common color names to CSS classes or hex codes
                        // This is a simple mapping, extend as needed
                        const bgMap: Record<string, string> = {
                            'Black': 'bg-black',
                            'White': 'bg-white border-gray-200',
                            'Gray': 'bg-gray-500',
                            'Blue': 'bg-blue-600',
                            'Red': 'bg-red-600',
                            'Green': 'bg-green-600',
                            'Beige': 'bg-[#f5f5dc]',
                            'Navy': 'bg-[#000080]',
                            'Olive': 'bg-[#808000]',
                            'Khaki': 'bg-[#c3b091]',
                        };

                        const bgClass = bgMap[variant] || 'bg-gray-200';

                        return (
                            <button
                                key={variant}
                                onClick={() => onSelect(variant)}
                                className={cn(
                                    "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all",
                                    isSelected ? "border-black p-0.5" : "border-transparent hover:border-gray-300"
                                )}
                                aria-label={`Select color ${variant}`}
                            >
                                <span className={cn("w-full h-full rounded-full border", bgClass)} />
                            </button>
                        );
                    }

                    return (
                        <button
                            key={variant}
                            onClick={() => onSelect(variant)}
                            className={cn(
                                "min-w-[3rem] px-4 py-2 border rounded-md text-sm font-medium transition-all",
                                isSelected
                                    ? "border-black bg-black text-white"
                                    : "border-gray-200 hover:border-black hover:text-black text-gray-700"
                            )}
                        >
                            {variant}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
