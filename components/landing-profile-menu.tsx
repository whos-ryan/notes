"use client";

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
        className="inline-flex size-11 items-center justify-center rounded-full border border-white/15 bg-black/25 text-sm text-foreground transition hover:bg-white/10"
        aria-label={`${profileLabel} profile`}
      >
        <span className="inline-flex size-8 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-black/25 text-xs">
          {profileImage ? (
            <Image
              src={profileImage}
              alt={profileLabel}
              width={32}
              height={32}
              className="size-full"
              unoptimized
            />
          ) : (
            initials
          )}
        </span>
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/15 bg-surface shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <h2 className="font-sans text-xl font-semibold">Profile</h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg border border-white/15 px-2 py-1 text-sm text-muted hover:bg-white/5 hover:text-foreground"
              >
                Close
              </button>
            </div>

            <div className="space-y-4 px-5 py-5">
              <div className="flex items-center gap-4">
                <div className="inline-flex size-16 items-center justify-center rounded-2xl border border-white/15 bg-black/25 text-2xl">
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

                <div className="space-y-2">
                  <p className="text-sm text-muted">{profileLabel}</p>
                  <button
                    type="button"
                    onClick={onPickImage}
                    className="rounded-xl border border-white/15 px-3 py-2 text-sm text-foreground hover:bg-white/10"
                  >
                    Edit/Add profile picture
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

              {error ? <p className="text-sm text-red-400">{error}</p> : null}

              <div className="grid gap-2">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => void onSaveProfile()}
                  className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm font-medium transition enabled:hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save picture"}
                </button>
                <button
                  type="button"
                  onClick={() => void onLogout()}
                  className="rounded-xl border border-red-400/40 px-3 py-2 text-sm text-red-300 transition hover:bg-red-500/10"
                >
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
