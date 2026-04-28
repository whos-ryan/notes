"use client";

import { Camera, LogOut, Save, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";

type LandingProfileMenuProps = {
  profileLabel: string;
  image: string | null;
};

export function LandingProfileMenu({
  profileLabel,
  image,
}: LandingProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [profileImage, setProfileImage] = useState(image);
  const [pendingImage, setPendingImage] = useState(image);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = profileLabel.slice(0, 1).toUpperCase();

  const onPickImage = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = (file: File | undefined) => {
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;

      if (typeof result === "string") {
        setPendingImage(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const onSaveProfile = async () => {
    setError(null);
    setIsSaving(true);

    const response = await fetch("/api/auth/update-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        image: pendingImage,
      }),
    });

    if (!response.ok) {
      setError("Unable to save profile image.");
      setIsSaving(false);
      return;
    }

    setProfileImage(pendingImage);
    setIsSaving(false);
    setIsOpen(false);
  };

  const onLogout = async () => {
    await fetch("/api/auth/sign-out", {
      method: "POST",
      credentials: "include",
    });

    window.location.assign("/");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex size-9 items-center justify-center rounded-md border border-border bg-sidebar text-sm text-foreground transition hover:bg-accent"
        aria-label={`${profileLabel} profile`}
      >
        <span className="inline-flex size-6 items-center justify-center overflow-hidden rounded-md border border-border bg-muted text-xs">
          {profileImage ? (
            <Image
              src={profileImage}
              alt={profileLabel}
              width={24}
              height={24}
              className="size-full"
              unoptimized
            />
          ) : (
            initials
          )}
        </span>
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4">
          <div className="w-full max-w-md border border-border bg-popover text-popover-foreground shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Account
                </p>
                <h2 className="mt-1 text-xl font-semibold">Profile</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="grid size-8 place-items-center rounded-md border border-border text-muted-foreground transition hover:bg-accent hover:text-foreground"
                aria-label="Close profile"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-5 px-5 py-5">
              <div className="flex items-center gap-4">
                <div className="inline-flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted text-2xl">
                  {pendingImage ? (
                    <Image
                      src={pendingImage}
                      alt={profileLabel}
                      width={64}
                      height={64}
                      className="size-full"
                      unoptimized
                    />
                  ) : (
                    initials
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-2">
                  <p className="truncate text-sm font-medium text-foreground">
                    {profileLabel}
                  </p>
                  <button
                    type="button"
                    onClick={onPickImage}
                    className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm text-muted-foreground transition hover:bg-accent hover:text-foreground"
                  >
                    <Camera className="size-4" />
                    Change picture
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) =>
                      onFileChange(event.currentTarget.files?.[0])
                    }
                  />
                </div>
              </div>

              {error ? (
                <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              ) : null}

              <div className="grid gap-2">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => void onSaveProfile()}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-primary px-3 text-sm font-medium text-primary-foreground transition enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save className="size-4" />
                  {isSaving ? "Saving..." : "Save picture"}
                </button>
                <button
                  type="button"
                  onClick={() => void onLogout()}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-destructive/30 px-3 text-sm text-destructive transition hover:bg-destructive/10"
                >
                  <LogOut className="size-4" />
                  Log out
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
