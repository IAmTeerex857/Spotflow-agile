"use client";

import { useState } from "react";
import { PenLine } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Menu, MenuItem, MenuLabel } from "@/components/ui/Menu";
import { usePokerName } from "@/lib/poker/useName";
import { NameDialog } from "./NameDialog";
import { PokerBrand } from "./PokerBrand";

/** Chrome for the Poker app pages: brand, Your rooms, and the player's name. */
export function TopBar() {
  const { name } = usePokerName();
  const [renaming, setRenaming] = useState(false);

  return (
    <>
      <SiteHeader
        brand={<PokerBrand />}
        links={[{ href: "/poker/rooms", label: "Your rooms" }]}
        actions={
          name ? (
            <Menu
              width={220}
              trigger={
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full border border-border bg-surface py-1 pl-1 pr-3 text-sm font-medium transition-colors hover:border-border-strong"
                >
                  <Avatar seed={name} size={26} />
                  <span className="hidden max-w-[140px] truncate sm:inline">{name}</span>
                </button>
              }
            >
              <MenuLabel>
                <div className="truncate font-display text-[13.5px] font-semibold">{name}</div>
                <div className="text-[11.5px] text-text-3">Saved on this browser</div>
              </MenuLabel>
              <MenuItem icon={<PenLine size={15} />} onSelect={() => setRenaming(true)}>
                Change name
              </MenuItem>
            </Menu>
          ) : null
        }
      />
      {renaming && <NameDialog open onOpenChange={setRenaming} />}
    </>
  );
}
