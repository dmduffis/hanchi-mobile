# Hanchi — User Personas

Hanchi is for foodies and culture-curious people: discovering communities and their histories, reconnecting with their own culture, trying something new, or grabbing a solid quick bite. Not a family-outing or kid-activity product.

---

## 1. Maya — The Curious Local

**28, marketing coordinator, lives in Astoria, Queens**

Has lived in NYC for six years and still feels like she's only seen a fraction of it. Follows a few "hidden gems NYC" Instagram accounts but never remembers to actually go anywhere — the information disappears into her saved posts and never turns into a plan.

- **Intent**: `explore` — try something new
- **Goal**: A low-effort way to discover something new within a 30-minute radius on a free Saturday, without hours of research
- **Frustration**: Generic "best restaurants" listicles all recommend the same five places; she wants the version a local would actually tell her
- **What gets her to open the app**: A specific, low-commitment prompt — "one dish, one afternoon" — not an open-ended "explore the map" ask
- **What makes her come back**: The passport/stamp mechanic. She's mildly competitive with herself and likes seeing progress

## 2. Diego — The Diaspora Foodie

**24, grad student, grew up in a Colombian-American household in Miami, now at Columbia**

Isn't new to Colombian culture — he grew up in it — but he's new to _this specific_ Colombian-American community in Jackson Heights, and he's curious how it differs from what he knows. Also just genuinely misses home cooking.

- **Intent**: `home` (and sometimes `explore` when comparing communities)
- **Goal**: Find the version of home that exists here — specific dishes, specific ingredients, a sense memory more than a tourist checklist
- **Frustration**: Apps built for tourists don't have the granularity he wants (he doesn't need "Colombian food," he needs to know which place makes bandeja paisa the way his abuela does)
- **What gets him to open the app**: Being able to search by dish, not just by neighborhood
- **What makes him come back**: The "insider" quotes from actual business owners — those feel true to him in a way generic descriptions don't

## 3. Sofia — The Homesick Transplant

**33, software engineer, moved from Odesa to NYC five years ago, lives in Astoria**

Didn't move to New York to "explore cultures" — she moved for work and stayed. Most days it's fine, but some weeks the distance from home hits harder. She's not looking for novelty. She's looking for something that feels like home, even in a small, imperfect way.

- **Intent**: `home`
- **Goal**: Find her _own_ community — not to discover something new, but to feel less far from something she already knows and misses. A bowl of real borscht, overhearing Ukrainian in the street, a shop that smells right
- **Frustration**: Most discovery apps are built entirely around novelty-seeking ("explore something new!"), which is the opposite of what she wants on the nights this matters most
- **What gets her to open the app**: Search or filter directly by culture/heritage and land immediately on Little Odessa — no browsing required
- **What makes her come back**: The Journal — a private record that she went, that it helped
- **Design implication**: "Discover the world without leaving your city" works for Maya — for Sofia, the pitch is "find home, right here." The app needs both framings without contradicting itself.

## 4. Sam — The History-Curious Foodie

**36, works in design, lives in Brooklyn, eats out a few times a week**

Cares about what a neighborhood _is_, not just what's good there. Wants the dish and the context — who settled here, why this corridor exists, what locals say about a place — without a museum-tour voice.

- **Intent**: `learn`
- **Goal**: Understand communities through food: stories, history, and insider voices alongside restaurants and dishes
- **Frustration**: Food apps ignore history; history content ignores where to eat. He wants both in one place, respectfully sourced
- **What gets him to open the app**: Community pages that feel specific and credited, not generic "vibrant melting pot" copy
- **What makes him come back**: New enclaves and dishes that deepen the map of the city he thought he already knew

## 5. Jordan — The Everyday Bite

**29, works late, lives near a busy corridor, doesn't want a project every time they're hungry**

Usually just needs somewhere good nearby — not a Saturday adventure. Still prefers places with character over chain defaults when the app can make that easy.

- **Intent**: `bite`
- **Goal**: A solid recommendation fast — open, decent, close, worth eating
- **Frustration**: Opening a discovery app and getting a research assignment when they just wanted dinner
- **What gets them to open the app**: Near-me, low-friction picks that still feel like Hanchi (culture-rooted spots), not another generic map dump
- **What makes them come back**: Reliability on weeknights — when it works once under time pressure, it becomes habit

---

## How these should inform the build

- **Maya** is the core discovery / stamps loop — try something new, collect progress
- **Diego and Sofia** are why search-by-dish, culture filter, and "find home" framing matter as much as novelty browsing
- **Sam** is why community history and insider voices sit next to restaurants, not in a separate essay app
- **Jordan** is why not every surface should demand a deep dive — quick bite mode should stay short and local

Out of scope for product focus: family outings, kid-friendliness as a primary filter, classroom field trips.

Feed this file to Cursor alongside screen prompts — it should help ground copywriting, empty states, and onboarding in an actual person rather than a generic "user."
