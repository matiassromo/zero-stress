// src/lib/ui/swal.ts
"use client";
import Swal, { SweetAlertIcon, SweetAlertOptions } from "sweetalert2";

export function confirm(options?: Partial<SweetAlertOptions>) {
  return Swal.fire({
    icon: "question",
    title: "¿Confirmar acción?",
    showCancelButton: true,
    confirmButtonText: "Sí, continuar",
    cancelButtonText: "Cancelar",
    reverseButtons: true,
    focusCancel: true,
    ...options,
  } as any);
}

// Toast arriba a la derecha
export function toast(icon: SweetAlertIcon, title: string, timer = 2000) {
  return Swal.fire({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer,
    timerProgressBar: true,
    icon,
    title,
  });
}

export default Swal;
export type { SweetAlertOptions } from "sweetalert2";
