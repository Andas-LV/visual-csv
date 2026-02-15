"use client";

import React from "react";
import useIsMobile from "@/shared/hooks/useIsMobile";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/shared/components/ui/dialog";
import {
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
	DrawerDescription,
	DrawerFooter,
} from "@/shared/components/ui/drawer";

interface ModalLayoutProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title?: React.ReactNode;
	description?: React.ReactNode;
	footer?: React.ReactNode;
	children: React.ReactNode;
	/** Класс для DialogContent / DrawerContent */
	className?: string;
}

/**
 * Адаптивный модальный контейнер:
 * - Desktop (>=768px) → Dialog (по центру экрана)
 * - Mobile (<768px)  → Drawer (снизу, свайп для закрытия)
 */
export function ModalLayout({
	open,
	onOpenChange,
	title,
	description,
	footer,
	children,
	className,
}: ModalLayoutProps) {
	const isMobile = useIsMobile();

	if (isMobile) {
		return (
			<Drawer open={open} onOpenChange={onOpenChange}>
				<DrawerContent className={className}>
					{(title || description) && (
						<DrawerHeader>
							{title && <DrawerTitle>{title}</DrawerTitle>}
							{description && (
								<DrawerDescription>{description}</DrawerDescription>
							)}
						</DrawerHeader>
					)}
					{children}
					{footer && <DrawerFooter>{footer}</DrawerFooter>}
				</DrawerContent>
			</Drawer>
		);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className={className}>
				{(title || description) && (
					<DialogHeader>
						{title && <DialogTitle>{title}</DialogTitle>}
						{description && (
							<DialogDescription>{description}</DialogDescription>
						)}
					</DialogHeader>
				)}
				{children}
				{footer && <DialogFooter>{footer}</DialogFooter>}
			</DialogContent>
		</Dialog>
	);
}
