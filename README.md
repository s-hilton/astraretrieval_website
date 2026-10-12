# Astra Retrieval — website

Information site for **Astra Retrieval**: asteroid capture and cislunar return.
It explains the three products (capture spacecraft, autonomous deep-space flight
software, and a private deep space network), the mission, the roadmap, and the team,
and lets people reach out by email.

It's a static site — plain HTML, CSS, and JavaScript with no build step.

## Structure

```
index.html              The whole site: six pages (Home, Platform, Mission, Roadmap, Company, Contact)
404.html                Not-found page
favicon.ico
assets/css/styles.css   Styles (colors and fonts are CSS variables in :root at the top)
assets/js/main.js       Page routing, mobile menu, copy-email button, and scroll animations
assets/img/             Logo, favicon, and background photos
```

### How the pages work

Each page is a `<section data-view="…">` inside `index.html`. The URL hash picks the
page (`/#platform`, `/#roadmap`, …); any other hash opens the page containing the
element with that id (e.g. `/#network` opens Platform and scrolls to the network
section). Unknown hashes fall back to Home.

### Images

| File | Use |
| --- | --- |
| `logo-wordmark.png` | Header / footer logo (white, transparent) |
| `favicon.png`, `apple-touch-icon.png`, `/favicon.ico` | Browser and home-screen icons |
| `hero-asteroid.jpg` | Hero background |
| `asteroid-milkyway.jpg` | "Join us" banner background |
| `og-image.jpg` | Link preview image for social sharing |

### Animations

Animations play once, when they come on screen (not on page load), and are turned
off for visitors who prefer reduced motion. Elements with `.count[data-to]` count up
to their value.

## Run locally

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploy

Any static host works (GitHub Pages, Netlify, Vercel, Cloudflare Pages).

**GitHub Pages:** Settings → Pages → *Deploy from a branch* → pick the branch and
`/ (root)`. To use `astraretrieval.com`, add a `CNAME` file containing the domain
and point the domain's DNS at GitHub Pages.

## Editing content

All copy lives in `index.html`, grouped by page (`data-view="home"`, `"platform"`, …).
The contact email is in the Contact page.

### Updating roadmap progress

The current phase is marked in three places in `index.html` (search for `We are here`):
the roadmap strip on Home, the roadmap line on Roadmap, and the phase cards on Roadmap.
Move the `now` class and the `<span class="chip now">We are here</span>` to the new
phase in each, and move `class="now"` on the "By product" table header (`<th>`) and its
column cells. The status strip under the header also names the current phase.

### Follow our progress (newsletter)

Updates are published on Medium. The "Follow" button in the top bar and the
"Follow our progress" / "Subscribe to updates" buttons link to the newsletter:
https://medium.com/astra-retrieval/newsletters/astra-retrieval-updates

To change the link, search `index.html` for `medium.com`.
