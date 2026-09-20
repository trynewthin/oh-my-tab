export const matrixPets = [
  { id: "cat", labelKey: "settings.pets.cat" },
  { id: "dog", labelKey: "settings.pets.dog" },
  { id: "happy", labelKey: "settings.pets.happy" },
  { id: "sleepy", labelKey: "settings.pets.sleepy" },
] as const

export type MatrixPet = (typeof matrixPets)[number]["id"]

export function isMatrixPet(value: unknown): value is MatrixPet {
  return matrixPets.some((pet) => pet.id === value)
}
