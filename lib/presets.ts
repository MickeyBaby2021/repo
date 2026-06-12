export type Preset = {
  label: string
  prompt: string
}

// Quick-start transformation prompts shown as chips, mirroring Lucy's examples.
export const PRESETS: Preset[] = [
  { label: "Albert Einstein", prompt: "Turn the person into Albert Einstein" },
  {
    label: "Anime Hero",
    prompt: "Transform into a vibrant anime hero with expressive eyes",
  },
  {
    label: "Capybara",
    prompt: "Turn the person into a friendly capybara",
  },
  {
    label: "Statue of Liberty",
    prompt: "Turn the person into the Statue of Liberty, weathered copper green",
  },
  {
    label: "Cyberpunk",
    prompt:
      "Cyberpunk character with neon lights, futuristic visor and glowing accents",
  },
  {
    label: "Oil Painting",
    prompt: "Render as a classical Renaissance oil painting portrait",
  },
  {
    label: "Astronaut",
    prompt: "Turn the person into an astronaut in a detailed space suit",
  },
  {
    label: "Claymation",
    prompt: "Stop-motion claymation character with sculpted clay texture",
  },
  {
    label: "Pixar Style",
    prompt: "Stylize as a 3D Pixar-style animated character",
  },
  {
    label: "Zombie",
    prompt: "Turn the person into a spooky zombie with pale decaying skin",
  },
]
