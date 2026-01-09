"use client";

import { useState, useEffect, useMemo } from "react";
import { Client } from "@/types/client";
import { listClients } from "@/lib/apiv2/clients";
import { debounce } from "@/lib/utils/debounce";

interface ClientSelectorProps {
  value: string | null;
  onChange: (clientId: string, client: Client | null) => void;
  error?: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

export default function ClientSelector({
  value,
  onChange,
  error,
  label = "Cliente",
  placeholder = "Buscar cliente por nombre o cédula...",
  disabled = false,
}: ClientSelectorProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Load clients when component mounts or search query changes
  const loadClients = async (query: string = "") => {
    setLoading(true);
    try {
      const data = await listClients(query);
      setClients(data);
    } catch (error) {
      console.error("Error loading clients:", error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  const debouncedSearch = useMemo(
    () => debounce((query: string) => loadClients(query), 300),
    []
  );

  useEffect(() => {
    loadClients();
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
    setIsOpen(true);
  };

  const handleSelectClient = (client: Client) => {
    onChange(client.id, client);
    setSearchQuery(client.name);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange("", null);
    setSearchQuery("");
    setIsOpen(false);
  };

  // Find selected client for display
  const selectedClient = value ? clients.find((c) => c.id === value) : null;

  return (
    <div className="relative">
      {label && <label className="block text-sm font-medium mb-1">{label}</label>}

      <div className="relative">
        <input
          type="text"
          className={`w-full rounded-2xl border ${
            error ? "border-red-500" : "border-neutral-300"
          } bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 ${
            disabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
          placeholder={placeholder}
          value={searchQuery || selectedClient?.name || ""}
          onChange={handleSearchChange}
          onFocus={() => setIsOpen(true)}
          disabled={disabled}
        />

        {(searchQuery || value) && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
          >
            ✕
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}

      {/* Dropdown */}
      {isOpen && !disabled && (
        <>
          {/* Backdrop to close dropdown */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Results dropdown */}
          <div className="absolute z-20 mt-1 w-full rounded-xl border border-neutral-200 bg-white shadow-lg max-h-60 overflow-y-auto">
            {loading && (
              <div className="p-4 text-sm text-neutral-500 text-center">
                Buscando...
              </div>
            )}

            {!loading && clients.length === 0 && (
              <div className="p-4 text-sm text-neutral-500 text-center">
                {searchQuery
                  ? "No se encontraron clientes"
                  : "No hay clientes registrados"}
              </div>
            )}

            {!loading &&
              clients.map((client) => (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => handleSelectClient(client)}
                  className="w-full px-4 py-3 text-left hover:bg-neutral-50 transition-colors border-b border-neutral-100 last:border-b-0"
                >
                  <div className="font-medium text-sm">{client.name}</div>
                  <div className="text-xs text-neutral-500">
                    Cédula: {client.nationalId} • Tel: {client.number}
                  </div>
                </button>
              ))}

            {/* Quick action to create new client */}
            <a
              href="/clientes/nuevo"
              target="_blank"
              rel="noopener noreferrer"
              className="block px-4 py-3 text-sm text-blue-600 hover:bg-blue-50 transition-colors border-t border-neutral-200"
            >
              + Crear nuevo cliente
            </a>
          </div>
        </>
      )}
    </div>
  );
}
