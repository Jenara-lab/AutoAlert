"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/permissions/auth";
import {
  createWorkshopSchema,
  updateWorkshopSchema,
  type CreateWorkshopValues,
  type UpdateWorkshopValues,
} from "@/lib/validations/workshops";

type ActionResult<T = undefined> = { error: string } | { data: T };

export async function getWorkshops(): Promise<ActionResult<Array<{
  id: string; name: string; address: string | null; phone: string | null;
  manager: string | null; mechanicId: string;
}>>> {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("workshops")
    .select("id, name, address, phone, manager, mechanic_id")
    .is("deleted_at", null)
    .order("name");

  if (error) return { error: "No se pudieron cargar los talleres." };

  const result = data.map((w) => ({
    id: w.id,
    name: w.name,
    address: w.address,
    phone: w.phone,
    manager: w.manager,
    mechanicId: w.mechanic_id,
  }));

  if (user.role === "mechanic") {
    return { data: result.filter((w) => w.mechanicId === user.id) };
  }

  return { data: result };
}

export async function getWorkshop(id: string): Promise<ActionResult<Record<string, unknown>>> {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("workshops")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error || !data) return { error: "Taller no encontrado." };

  if (user.role === "mechanic" && data.mechanic_id !== user.id) {
    return { error: "No tienes acceso a este taller." };
  }

  return { data };
}

export async function getActiveWorkshops(): Promise<ActionResult<Array<{
  id: string; name: string; address: string | null;
}>>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("workshops")
    .select("id, name, address")
    .is("deleted_at", null)
    .order("name");

  if (error) return { error: "No se pudieron cargar los talleres." };
  return { data };
}

export async function createWorkshop(values: CreateWorkshopValues): Promise<ActionResult<string>> {
  const user = await requireAuth();

  const parsed = createWorkshopSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa los datos." };

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("workshops")
    .insert({
      mechanic_id: user.id,
      name: parsed.data.name,
      address: parsed.data.address || null,
      phone: parsed.data.phone || null,
      manager: parsed.data.manager || null,
    })
    .select("id")
    .single();

  if (error) return { error: "No se pudo crear el taller." };

  revalidatePath("/workshops");
  return { data: data.id };
}

export async function updateWorkshop(
  id: string,
  values: UpdateWorkshopValues,
): Promise<ActionResult> {
  const user = await requireAuth();

  const parsed = updateWorkshopSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa los datos." };

  const supabase = await createClient();

  const { error: checkError } = await supabase
    .from("workshops")
    .select("id")
    .eq("id", id)
    .eq("mechanic_id", user.id)
    .is("deleted_at", null)
    .single();

  if (checkError) return { error: "Taller no encontrado." };

  const updateData: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.address !== undefined) updateData.address = parsed.data.address || null;
  if (parsed.data.phone !== undefined) updateData.phone = parsed.data.phone || null;
  if (parsed.data.manager !== undefined) updateData.manager = parsed.data.manager || null;

  if (Object.keys(updateData).length === 0) return { data: undefined };

  const { error } = await supabase.from("workshops").update(updateData).eq("id", id);

  if (error) return { error: "No se pudo actualizar el taller." };

  revalidatePath("/workshops");
  revalidatePath(`/workshops/${id}`);
  return { data: undefined };
}

export async function deleteWorkshop(id: string): Promise<ActionResult> {
  const user = await requireAuth();

  const supabase = await createClient();

  const { error } = await supabase
    .from("workshops")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("mechanic_id", user.id)
    .is("deleted_at", null);

  if (error) return { error: "No se pudo eliminar el taller." };

  revalidatePath("/workshops");
  return { data: undefined };
}
