"use client";
import { useState } from "react";

type Props = {
  onSearch: (q: string) => void;
  placeholder?: string;
};

export default function SearchBar({ onSearch, placeholder }: Props) {
  const [q, setQ] = useState("");
  return (
    <div className="flex gap-2">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSearch(q)}
        placeholder={placeholder ?? "Buscar productos..."}
        className="w-full rounded-xl border px-4 py-2"
      />
      <button
        onClick={() => onSearch(q)}
        className="rounded-xl bg-blue-600 px-4 py-2 text-white"
      >
        Buscar
      </button>
    </div>
  );
}
