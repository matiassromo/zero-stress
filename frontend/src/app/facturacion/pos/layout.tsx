"use client";

import React from "react";

export default function PosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="p-4">
      {/* Aquí puedes incluir encabezados, navegación o wrappers del POS */}
      {children}
    </section>
  );
}
