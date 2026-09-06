export const matrixPets = [
  { id: "cat", label: "猫咪 (^ω^)", action: "眨眼、张嘴" },
  { id: "dog", label: "小狗 (•ᴥ•)", action: "侧看、吐舌" },
  { id: "happy", label: "开心 (>ᴗ<)", action: "举手、跳动" },
  { id: "sleepy", label: "困困 (-ω-)", action: "打盹、呼吸" },
] as const
export type MatrixPet = (typeof matrixPets)[number]["id"]
export function isMatrixPet(value: unknown): value is MatrixPet {
  return matrixPets.some((pet) => pet.id === value)
}
