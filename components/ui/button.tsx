"use client";

import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

type Theme = "amber" | "red" | "brand" | "slate" | "emerald";

const getThemeClasses = (
  variant: "default" | "secondary" | "outline" | "ghost",
  theme: Theme
) => {
  const themeMap = {
    amber: {
      default: "bg-amber-600 text-white lg:hover:bg-amber-700",
      secondary:
        "bg-amber-100 text-amber-700 lg:hover:bg-amber-200 border border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700 lg:dark:hover:bg-amber-900/50",
      outline:
        "border border-slate-300 bg-transparent text-slate-900 lg:hover:border-amber-500 lg:hover:text-amber-600 dark:border-slate-700 dark:text-slate-100 lg:dark:hover:border-amber-500 lg:dark:hover:text-amber-400",
      ghost:
        "bg-transparent text-slate-900 lg:hover:bg-amber-50 lg:hover:text-amber-600 dark:bg-transparent dark:text-slate-100 lg:dark:hover:bg-amber-900/20 lg:dark:hover:text-amber-400",
    },
    red: {
      default: "bg-red-600 text-white lg:hover:bg-red-700",
      secondary:
        "bg-red-100 text-red-700 lg:hover:bg-red-200 border border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700 lg:dark:hover:bg-red-900/50",
      outline:
        "border border-slate-300 bg-transparent text-slate-900 lg:hover:border-red-500 lg:hover:text-red-600 dark:border-slate-700 dark:text-slate-100 lg:dark:hover:border-red-500 lg:dark:hover:text-red-400",
      ghost:
        "bg-transparent text-slate-900 lg:hover:bg-red-50 lg:hover:text-red-600 dark:bg-transparent dark:text-slate-100 lg:dark:hover:bg-red-900/20 lg:dark:hover:text-red-400",
    },
    brand: {
      default: "bg-brand text-brand-foreground lg:hover:bg-brand/90",
      secondary:
        "bg-brand/10 text-brand lg:hover:bg-brand/20 border border-brand/30 dark:bg-brand/20 dark:text-brand dark:border-brand/50 lg:dark:hover:bg-brand/30",
      outline:
        "border border-slate-300 bg-transparent text-slate-900 lg:hover:border-brand lg:hover:text-brand dark:border-slate-700 dark:text-slate-100 lg:dark:hover:border-brand lg:dark:hover:text-brand",
      ghost:
        "bg-transparent text-slate-900 lg:hover:bg-brand/10 lg:hover:text-brand dark:bg-transparent dark:text-slate-100 lg:dark:hover:bg-brand/20 lg:dark:hover:text-brand",
    },
    slate: {
      default: "bg-slate-600 text-white lg:hover:bg-slate-700",
      secondary:
        "bg-white text-slate-900 lg:hover:bg-slate-200 border border-slate-300 dark:bg-slate-800 dark:text-slate-100 lg:dark:hover:bg-slate-700 dark:border-slate-700",
      outline:
        "border border-slate-300 bg-transparent text-slate-900 lg:hover:border-slate-500 lg:hover:text-slate-600 dark:border-slate-700 dark:text-slate-100 lg:dark:hover:border-slate-500 lg:dark:hover:text-slate-400",
      ghost:
        "bg-transparent text-slate-900 lg:hover:bg-slate-100 dark:bg-transparent dark:text-slate-100 lg:dark:hover:bg-slate-800",
    },
    emerald: {
      default: "bg-emerald-600 text-white lg:hover:bg-emerald-700",
      secondary:
        "bg-emerald-100 text-emerald-700 lg:hover:bg-emerald-200 border border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700 lg:dark:hover:bg-emerald-900/50",
      outline:
        "border border-slate-300 bg-transparent text-slate-900 lg:hover:border-emerald-500 lg:hover:text-emerald-600 dark:border-slate-700 dark:text-slate-100 lg:dark:hover:border-emerald-500 lg:dark:hover:text-emerald-400",
      ghost:
        "bg-transparent text-slate-900 lg:hover:bg-emerald-50 lg:hover:text-emerald-600 dark:bg-transparent dark:text-slate-100 lg:dark:hover:bg-emerald-900/20 lg:dark:hover:text-emerald-400",
    },
  };

  return themeMap[theme][variant];
};

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "",
        secondary: "",
        outline: "",
        ghost: "",
      },
      theme: {
        amber: "",
        red: "",
        brand: "",
        slate: "",
        emerald: "",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      theme: "brand",
      size: "default",
    },
    compoundVariants: [
      // default variant
      {
        variant: "default",
        theme: "amber",
        class: getThemeClasses("default", "amber"),
      },
      {
        variant: "default",
        theme: "red",
        class: getThemeClasses("default", "red"),
      },
      {
        variant: "default",
        theme: "brand",
        class: getThemeClasses("default", "brand"),
      },
      {
        variant: "default",
        theme: "slate",
        class: getThemeClasses("default", "slate"),
      },
      {
        variant: "default",
        theme: "emerald",
        class: getThemeClasses("default", "emerald"),
      },
      // secondary variant
      {
        variant: "secondary",
        theme: "amber",
        class: getThemeClasses("secondary", "amber"),
      },
      {
        variant: "secondary",
        theme: "red",
        class: getThemeClasses("secondary", "red"),
      },
      {
        variant: "secondary",
        theme: "brand",
        class: getThemeClasses("secondary", "brand"),
      },
      {
        variant: "secondary",
        theme: "slate",
        class: getThemeClasses("secondary", "slate"),
      },
      {
        variant: "secondary",
        theme: "emerald",
        class: getThemeClasses("secondary", "emerald"),
      },
      // outline variant
      {
        variant: "outline",
        theme: "amber",
        class: getThemeClasses("outline", "amber"),
      },
      {
        variant: "outline",
        theme: "red",
        class: getThemeClasses("outline", "red"),
      },
      {
        variant: "outline",
        theme: "brand",
        class: getThemeClasses("outline", "brand"),
      },
      {
        variant: "outline",
        theme: "slate",
        class: getThemeClasses("outline", "slate"),
      },
      {
        variant: "outline",
        theme: "emerald",
        class: getThemeClasses("outline", "emerald"),
      },
      // ghost variant
      {
        variant: "ghost",
        theme: "amber",
        class: getThemeClasses("ghost", "amber"),
      },
      {
        variant: "ghost",
        theme: "red",
        class: getThemeClasses("ghost", "red"),
      },
      {
        variant: "ghost",
        theme: "brand",
        class: getThemeClasses("ghost", "brand"),
      },
      {
        variant: "ghost",
        theme: "slate",
        class: getThemeClasses("ghost", "slate"),
      },
      {
        variant: "ghost",
        theme: "emerald",
        class: getThemeClasses("ghost", "emerald"),
      },
    ],
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, theme, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, theme, size }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
