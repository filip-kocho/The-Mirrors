import { test, expect } from "@playwright/test";
import { initialState } from "../../src/game/domain/engine";
import { roomGraph } from "../../src/game/map/roomGraph";
import { effectClips } from "../../src/audio/effectClips";

test("every downloaded effect decodes to non-silent audio", async ({
  page,
}) => {
  await page.goto("/");
  const files = [
    ...new Set(Object.values(effectClips).flatMap((clip) => clip.files)),
  ];
  const decoded = await page.evaluate(async (files) => {
    const context = new AudioContext();
    try {
      return await Promise.all(
        files.map(async (file) => {
          const response = await fetch("/audio/sfx/" + file);
          if (!response.ok) throw Error(file + " is unavailable");
          const buffer = await context.decodeAudioData(
            await response.arrayBuffer(),
          );
          let peak = 0;
          for (const sample of buffer.getChannelData(0))
            peak = Math.max(peak, Math.abs(sample));
          return { file, duration: buffer.duration, peak };
        }),
      );
    } finally {
      await context.close();
    }
  }, files);
  for (const clip of decoded) {
    expect(clip.duration, clip.file).toBeGreaterThan(0.05);
    expect(clip.duration, clip.file).toBeLessThan(20);
    expect(clip.peak, clip.file).toBeGreaterThan(0.005);
  }
});

test("opt-in audio plays recorded music and effects, persists levels, and continues through handoff", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = window.AudioContext;
    const probe = {
      contexts: [] as AudioContext[],
      tones: 0,
      noises: 0,
      media: [] as HTMLMediaElement[],
    };
    (window as unknown as { audioProbe: typeof probe }).audioProbe = probe;
    window.AudioContext = class extends original {
      constructor(options?: AudioContextOptions) {
        super(options);
        probe.contexts.push(this);
      }
      createMediaElementSource(element: HTMLMediaElement) {
        probe.media.push(element);
        return super.createMediaElementSource(element);
      }
      createOscillator() {
        probe.tones++;
        return super.createOscillator();
      }
      createBufferSource() {
        probe.noises++;
        return super.createBufferSource();
      }
    };
  });
  await page.goto("/");
  const probe = () =>
    page.evaluate(() => {
      const p = (
        window as unknown as {
          audioProbe: {
            contexts: AudioContext[];
            media: HTMLMediaElement[];
            tones: number;
            noises: number;
          };
        }
      ).audioProbe;
      return {
        duration: p.media[0]?.duration,
        position: p.media[0]?.currentTime,
        paused: p.media[0]?.paused,
        src: p.media[0]?.src,
        count: p.contexts.length,
        state: p.contexts.at(-1)?.state,
        tones: p.tones,
        noises: p.noises,
      };
    });
  expect((await probe()).count).toBe(0);
  await page.getByLabel("Sound settings", { exact: true }).click();
  await page.getByRole("button", { name: "Enable sound", exact: true }).click();
  await expect.poll(async () => (await probe()).state).toBe("running");
  await expect
    .poll(async () => (await probe()).duration, { timeout: 15000 })
    .toBeGreaterThan(100);
  await expect.poll(async () => (await probe()).position).toBeGreaterThan(0);
  expect((await probe()).tones).toBe(0);
  await page
    .getByLabel("Music track", { exact: true })
    .selectOption("darkest-child");
  await expect
    .poll(async () => (await probe()).duration, { timeout: 15000 })
    .toBeGreaterThan(230);
  await expect.poll(async () => (await probe()).position).toBeGreaterThan(0);
  expect((await probe()).src).toContain("darkest-child.mp3");
  const before = (await probe()).noises;
  await page.getByRole("button", { name: "Preview sound" }).click();
  await expect.poll(async () => (await probe()).noises).toBeGreaterThan(before);
  expect((await probe()).tones).toBe(0);
  await page.getByRole("slider", { name: "Ambient music volume" }).fill("0");
  await page.getByRole("slider", { name: "Sound effects volume" }).fill("0");
  await expect(
    page.getByRole("button", { name: "Preview sound" }),
  ).toBeDisabled();
  await page.getByRole("slider", { name: "Sound effects volume" }).fill("40");
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("the-mirrors-audio-v1")!),
    ),
  ).toEqual({ enabled: true, music: 0, effects: 0.4, track: "darkest-child" });
  expect((await probe()).paused).toBe(true);
  await page.getByRole("slider", { name: "Ambient music volume" }).fill("28");
  const s = initialState(["Rowan", "Elara"], "audio-browser");
  await page.evaluate(
    (s) => localStorage.setItem("the-mirrors-save-v1", JSON.stringify(s)),
    s,
  );
  await page.getByLabel("Sound settings", { exact: true }).click();
  await page.getByRole("button", { name: "Resume saved expedition" }).click();
  await expect.poll(async () => (await probe()).state).toBe("running");
  expect((await probe()).paused).toBe(false);
  await page.getByRole("button", { name: "I am Rowan" }).click();
  await expect.poll(async () => (await probe()).state).toBe("running");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect.poll(async () => (await probe()).state).toBe("suspended");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => false,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect.poll(async () => (await probe()).state).toBe("running");
  const noises = (await probe()).noises;
  await page
    .locator(`.map-panel [data-room-id="${roomGraph.Hall.neighbors[0]}"]`)
    .click();
  await page.getByRole("button", { name: /Move here/ }).click();
  await expect.poll(async () => (await probe()).noises).toBeGreaterThan(noises);
  const position = (await probe()).position!;
  await page.getByRole("button", { name: /End turn/ }).click();
  await expect.poll(async () => (await probe()).state).toBe("running");
  expect((await probe()).paused).toBe(false);
  await expect
    .poll(async () => (await probe()).position)
    .toBeGreaterThan(position);
  await page.getByLabel("Sound settings", { exact: true }).click();
  await page.getByRole("button", { name: "Mute all sound" }).click();
  await page.reload();
  await page.getByLabel("Sound settings", { exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Enable sound", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("slider", { name: "Sound effects volume" }),
  ).toHaveValue("40");
  expect((await probe()).count).toBe(0);
});
