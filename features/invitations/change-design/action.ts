"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  invitationPalettes,
  invitationThemes,
} from "@/invitation/themes";
import { createClient } from "@/shared/supabase/server";

const schema = z.object({
  eventId: z.string().uuid(),
  themeId: z.enum(invitationThemes.map((theme) => theme.id)),
  paletteId: z.enum(invitationPalettes.map((palette) => palette.id)),
});

export type ChangeInvitationDesignState = {
  success?: string;
  error?: string;
};

export async function changeInvitationDesign(
  input: z.infer<typeof schema>,
): Promise<ChangeInvitationDesignState> {
  const parsed = schema.safeParse(input);

  if (!parsed.success) {
    return { error: "Seleccion invalida." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Necesitas iniciar sesion." };
  }

  const { error } = await supabase
    .from("events")
    .update({
      theme_id: parsed.data.themeId,
      palette_id: parsed.data.paletteId,
    })
    .eq("id", parsed.data.eventId);

  if (error) {
    return { error: "No pudimos guardar el diseno." };
  }

  revalidatePath("/admin/personal/invitacion/preview");
  revalidatePath("/admin/personal/invitacion/publicar");

  return { success: "Diseno guardado." };
}
