# Our Little Blue Universe 💙

A complete mobile-first anniversary experience built with plain HTML, CSS, and JavaScript. It runs without a database, account, build step, or paid service.

The first welcome and password-success entrance use two different custom cartoon portraits. Cute bear emoji remain in the later themed sections; no copyrighted character artwork is bundled.

## What is included

- Magical intro, optional love-password gate, and optional music prompt
- Live relationship counter
- Editable relationship timeline with hidden notes
- Swipeable scrapbook gallery with a full-screen viewer
- Local song, Spotify, YouTube, voice-note, and video hooks
- Animated sealed love letter
- Four mini-games: falling-heart catcher, 8-pair memory match, relationship quiz, and 3×3 sliding puzzle
- Five hidden hearts, four gated gifts, and five+ playful Easter eggs
- Persistent achievements, game progress, gift progress, and coupon redemptions using `localStorage`
- Eight redeemable love coupons and a 50-note love jar
- Interactive night sky, emotional chapter, funny chapter, and tap-responsive bears
- Cinematic final surprise with confetti, fireworks, a playful “NO” button, and a celebratory “YES” ending
- A three-wave final “YES” celebration lasting about three seconds, with expanded confetti, fireworks, light flashes, and coordinated sound effects
- Full-screen cinematic entrance after the correct password, with a blue-universe portal, personalized reveal, sound effects, and music-or-quiet entry choices
- Internet-sourced comet, rocket, and bear-couple spaceship artwork in the cinematic entrance, animated locally without hotlinking
- Random Bubu & Dudu surprise visitors that cross, float, or peek onto the screen while the story is being explored

The coupon section is a soft blue romantic coupon book with clouds, hearts, sparkles, simple messages, redemption progress, sound, and optional phone haptics. Coupon titles, icons, and messages come from the `coupons` list in `js/config.js`.

The premium typography uses Caveat, DM Serif Display, and Nunito from Google Fonts. If the phone is offline, the website automatically falls back to the system fonts and remains fully usable.

Open the `index.html` located directly inside the main `anniversary-love-experience` folder. The Memory Match pictures are stored in `images/match/` and their paths are configured in `memoryMatchImages` inside `js/config.js`.

The **Piece Us Together** game uses `images/puzzle/pieces-us-together.jpg`. To replace it later, put your new picture in that folder and update `puzzleGame.image`, `puzzleGame.alt`, and `puzzleGame.aspectRatio` in `js/config.js`. For example, a 1200 × 900 picture uses `aspectRatio: "1200 / 900"`.
- Touch-friendly layout for 375–430 px phones plus tablet and desktop styles
- Reduced-motion support, keyboard access, focus styles, and no audio autoplay

## Start here: personalize the website

Open [`js/config.js`](js/config.js). Almost everything personal lives in that one file.

Change these first:

```js
names: {
  myName: "YOUR NAME",
  girlfriendName: "HER NAME",
  nickname: "Baby"
},

dates: {
  anniversary: "2026-08-10",
  relationshipStart: "2023-08-10T00:00:00"
},

lock: {
  enabled: true,
  password: "baby"
}
```

- Use dates in `YYYY-MM-DD` format.
- Set `lock.enabled` to `false` to skip the password screen.
- The password is intentionally simple and lives in the browser code. It is a cute gate, not real security.
- Replace the love letter, timeline, memories, quiz, funny habits, coupons, reasons, night messages, and finale text in the same file.
- Quiz answers use the option number starting at zero. For example, the first option is `answer: 0`. Use `answer: null` when every answer should be accepted.

## Change the opening cartoon portrait

The two openings deliberately use different images:

- `images/entrance/first-heart-portrait.png` is the heart-shaped picture on the very first welcome screen. Replace it with a portrait image using the same filename; the heart crop is applied automatically.
- `images/entrance/cartoon-couple-heads.png` is the transparent couple portrait in the cinematic entrance after the password.

## Add photos to “How We Became Us”

1. Put each timeline image inside `images/timeline/`.
2. Add the matching path to that timeline entry in `js/config.js`:

```js
{
  date: "The beginning",
  title: "The Day We Met",
  emoji: "✨",
  description: "The day our story began.",
  secret: "My hidden message for you.",
  image: "images/timeline/beginning.jpg"
}
```

Give every timeline entry its own `image` path. Leave `image: ""` only when you do not want a photo on that card. File names and capitalization must match exactly after publishing.

## Add your photos

1. Put image files inside `images/memories/`.
2. In `js/config.js`, add the relative file path to each memory:

```js
{
  title: "Our First Date",
  image: "images/memories/first-date.jpg",
  date: "August 10, 2023",
  location: "Our favorite café",
  caption: "The beginning of my favorite story.",
  secret: "I was so nervous—and so happy.",
  accent: "sky"
}
```

3. Also set `meaningfulPhoto` and `finalePhoto` under `media` if you want photographs in those sections.

Landscape or square images work best. The site crops images to fit, so keep faces near the center.

## Change the Memory Match cards

Put eight portrait images in `images/match/`, then update `memoryMatchImages` in `js/config.js`. Each listed image automatically appears twice to create one matching pair. Use exactly eight entries for the complete 16-card game.

## Add music, video, and a voice note

Put the files in the matching folders, then edit the `media` section in `js/config.js`:

```js
media: {
  songTitle: "Our Song",
  songArtist: "Artist Name",
  songVolume: 0.42,
  videoBackgroundMusicVolume: 0.16,
  videoVolume: 0.40,
  localSong: "audio/our-song.mp3",
  spotifyUrl: "https://open.spotify.com/...",
  youtubeUrl: "https://youtube.com/...",
  voiceMessage: "audio/message.mp3",
  videoMessage: "videos/message.mp4",
  meaningfulPhoto: "images/memories/meaningful.jpg",
  finalePhoto: "images/memories/favorite.jpg"
}
```

- You may use a local song, Spotify, YouTube, or a combination.
- `songVolume` is clamped between `0.25` and `0.65` for a comfortable listening range; `0.42` is the balanced default for earphones.
- `videoBackgroundMusicVolume` controls how softly the song plays behind the personal video. The website automatically fades to this level on video play and restores `songVolume` when the video pauses, ends, or fails.
- `videoVolume` sets the personal video’s starting volume. Use `0.40` for 40%; the visitor can still adjust it using the video controls.
- Audio and video never autoplay on first visit. Mobile browsers require a tap first.

## Change the sound effects

The website creates button, sparkle, game, achievement, and fireworks sounds automatically—no extra sound files are required. Change the master volume in `js/config.js`:

```js
soundEffects: {
  enabled: true,
  volume: 0.32,
  buttonFile: "audio/button-bubble-sfx.mp3",
  confettiFile: "audio/confetti-sfx.mp3",
  fireworksFile: "audio/fireworks-sfx.mp3"
}
```

The `buttonFile` sound plays for button interactions. The `confettiFile` sound plays every time confetti appears. The `fireworksFile` sound plays during the major fireworks celebrations, including the final Happy Anniversary moment. Replace any MP3 path if desired. Use a volume from `0` to `1`, or set `enabled: false` to remove sound effects. Visitors can also use the speaker button at the top of the website, and their preference is remembered on that device.
- MP3 is the safest audio format. MP4 with H.264 video and AAC audio is the safest video format.
- Keep media files reasonably small for faster phone loading. Compress long videos before publishing.

## Preview it on your computer

The simplest option is to double-click `index.html`. For the most accurate preview—especially for media—serve the folder with any local web server such as VS Code Live Server.

Then use your browser’s responsive/device view and check widths around 375 px, 390 px, and 430 px.

## Test your personalized version

Before sending the link, check this short list:

1. Open the intro and enter your password.
2. Confirm the names and dates are correct.
3. Tap every timeline card and gallery photo.
4. Play each audio/video item.
5. Finish each game once.
6. Find all five hidden hearts.
7. Redeem a test coupon, refresh, and confirm the stamp remains.
8. Open the final surprise and tap “One More Thing…”
9. Use the footer reset button to clear your test progress before sharing on the phone you tested with.

Progress is saved separately on each device/browser. It does not sync and no personal data is uploaded.

## Publish it free

### GitHub Pages

1. Create a new GitHub repository.
2. Upload everything in this folder, keeping the folder structure unchanged.
3. Open the repository’s **Settings → Pages**.
4. Choose **Deploy from a branch**, select your main branch, and choose the root folder.
5. Save and wait for the public link.

The included `.nojekyll` file tells GitHub Pages to serve this as a plain static site.

After publishing, you may replace the relative `og:image` value in `index.html` with the full public URL to `images/og.png` for the most reliable social-link previews.

### Netlify

1. Sign in to Netlify.
2. Open the manual deployment/drop area.
3. Drag this entire folder into it.
4. Netlify will give you a public link. You can change the site name afterward.

### Vercel

1. Put the project in a GitHub repository.
2. Import that repository into Vercel.
3. Choose **Other** if it asks for a framework.
4. Leave the build command empty and publish the project root.

## File guide

```text
index.html              All story sections and accessible page structure
css/style.css           Main visual design
css/animations.css      Motion, reveals, confetti, and reduced-motion rules
css/responsive.css      Phone, tablet, desktop, and landscape adjustments
js/config.js            Your one-stop personalization file
js/app.js               Interactions, games, persistence, and finale logic
images/memories/        Your photos
images/entrance/        Opening cartoon couple portrait
audio/                  Your songs and voice notes
videos/                 Your personal video
```

Third-party space artwork and its license attribution are documented in `THIRD_PARTY_ASSETS.md`.

The timing, messages, image paths, and enabled setting for the roaming Bubu & Dudu surprises are in `wanderingSurprises` inside `js/config.js`.

## Useful notes

- To start progress over, use **Reset this device’s progress** in the footer.
- If you rename a coupon ID after redeeming it, the browser treats it as a new coupon.
- If an image path is wrong, the site falls back to its built-in cute placeholder instead of showing a broken image.
- Keep `config.js` above `app.js` in `index.html`.
- Do not put private information in the password or source files. Anyone who can view the site source can read them.

Made to be customized, shared, and remembered. 💙
