# Third-party notices

This page is about what the Walka website is made with, and what of that
is in the pages a visitor downloads. Walka itself has notices of its own:
[THIRD-PARTY-NOTICES.md](https://github.com/AntonyPerez0/walka-addon/blob/HEAD/THIRD-PARTY-NOTICES.md)
in Walka's repository.

## Fonts

The site serves two typefaces from its own address. Both are published
under the SIL Open Font License, Version 1.1, which asks that the
copyright notice and the licence go with every copy. They do: the full
texts are in [`static/licences/`](static/licences/) and are published
with the site, at `licences/Inter-OFL.txt` and `licences/Spectral-OFL.txt`.

* **Inter** - Copyright 2016 The Inter Project Authors
  (<https://github.com/rsms/inter>). Used for text, labels and numbers.
* **Spectral** - Copyright 2017 The Spectral Project Authors
  (<https://github.com/productiontype/Spectral>). Used for headings.

The font files come from the [Fontsource](https://fontsource.org) packages
`@fontsource-variable/inter` and `@fontsource/spectral`, at the versions
fixed in `package-lock.json`. They are not changed.

## In the site's scripts

The scripts a visitor's browser runs are built from this repository's code
together with:

* **Svelte** and **SvelteKit** - Copyright (c) Svelte Contributors,
  published under the MIT licence (<https://github.com/sveltejs/svelte>,
  <https://github.com/sveltejs/kit>).
* **supabase-js** (`@supabase/supabase-js`), the library through which the
  account pages talk to the accounts' database - Copyright (c) 2020
  Supabase, published under the MIT licence
  (<https://github.com/supabase/supabase-js>). It brings these with it,
  and parts of them end up in the same file:
  * `@supabase/auth-js`, `@supabase/functions-js`,
    `@supabase/postgrest-js`, `@supabase/realtime-js` and
    `@supabase/storage-js` - Copyright (c) 2020 Supabase, MIT licence;
  * `iceberg-js` - Copyright (c) 2025 Supabase, MIT licence;
  * `@supabase/phoenix` - Copyright (c) 2014 Chris McCord, MIT licence;
  * `tslib` - Copyright (c) Microsoft Corporation, published under the
    BSD Zero Clause License, which asks for no notice.

  That file is in every build of the site. A browser fetches it only on
  the account pages of a site that is built with accounts
  ([docs/accounts-setup.md](docs/accounts-setup.md)); without accounts
  nothing ever asks for it.

Their exact versions are in `package-lock.json`. The MIT licence, in full:

```
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Food data, on a site with accounts

The food diary looks foods up in two public lists. Neither list is in
this repository or in the published site: they are asked when a signed-in
person searches for a food or gives a barcode. The page says, with every
result, which list it came from.

* **Open Food Facts** (<https://openfoodfacts.org>). Its database is made
  available under the
  [Open Database License](https://opendatacommons.org/licenses/odbl/1-0/)
  (ODbL), and its contents under the Database Contents License. The food
  diary names Open Food Facts and that licence, with links to both,
  wherever a result from it is on the screen.

  The site keeps no copy of the database and passes none on. Of a product
  a person picks, the name, the brand and the calories are kept in that
  person's own account, where only that person can read them.
* **USDA FoodData Central** (<https://fdc.nal.usda.gov>). Its data is in
  the public domain (CC0 1.0), and it asks to be named as the source:
  U.S. Department of Agriculture, Agricultural Research Service.
  FoodData Central, 2019. fdc.nal.usda.gov.

Both are named with their terms on the site itself as well, in its terms
of use under "The food lists".

One list is in the published site: **USDA's common foods**
(`static/food/common-foods.json`), about 7,400 plain foods - their USDA
number, name, calories in 100 g and one serving - from FoodData Central's
"SR Legacy" data (April 2018), which is in the public domain. It is made
by `scripts/common-foods.mjs`, and the diary finds its foods as somebody
types, without asking anybody. USDA is named as above wherever they are
shown.

## The food diary's readers

Three readers that run on the phone, served by the site itself from
`food-tools/` (`scripts/food-tools.mjs` puts them there from the packages
below, at the versions fixed in `package-lock.json`). A browser fetches
each only when the person first uses it.

* **barcode-detector** - Copyright (c) 2023 Ze-Zheng Wu, MIT licence
  (<https://github.com/Sec-ant/barcode-detector>), with **zxing-wasm** -
  Copyright (c) 2023 Ze-Zheng Wu, MIT licence
  (<https://github.com/Sec-ant/zxing-wasm>), which is built from
  **zxing-cpp** - Copyright 2016 Nu-book Inc., Copyright 2016 ZXing
  authors, Apache License 2.0 (<https://github.com/zxing-cpp/zxing-cpp>).
  Reads barcodes where the browser cannot.
* **tesseract.js** and **tesseract.js-core** - Copyright 2015 Jerome Wu,
  Apache License 2.0 (<https://github.com/naptha/tesseract.js>), built
  from **Tesseract OCR** - Apache License 2.0
  (<https://github.com/tesseract-ocr/tesseract>), with the English data of
  `@tesseract.js-data/eng` (from tesseract-ocr/tessdata, Apache License
  2.0). Reads the text of a nutrition label.
* **ONNX Runtime Web** (`onnxruntime-web`) - Copyright (c) Microsoft
  Corporation, MIT licence (<https://github.com/microsoft/onnxruntime>).
  Runs the dish recogniser.
* **The dish recogniser**: `juan1211/pratos-convnext-tiny-food101` on
  Hugging Face, revision `2f29e0eab1496f94cff2c54d1841cdce23dd23cb`,
  published under the Apache License 2.0 - a ConvNeXt-tiny model
  (Facebook AI Research, Apache License 2.0) fine-tuned on the Food-101
  dataset (Bossard, Guillaumin and Van Gool, ETH Zurich, 2014). It is
  fetched when the site is built and checked against its SHA-256; it is
  not changed. The names of its 101 dishes are Food-101's.

The Apache License 2.0 is at <https://www.apache.org/licenses/LICENSE-2.0>.

## Used to build the site, not part of it

Vite (MIT), TypeScript (Apache License 2.0), svelte-check (MIT) and sharp
(Apache License 2.0), which makes the smaller versions of the pictures.
Their exact versions are in `package-lock.json`.

The checks of the accounts' database (`npm run test:database`) and the
database on a developer's own computer use the Supabase command line
(`supabase`, MIT), fetched by `npx` when it is asked for. It is not in
`package-lock.json`: its version is the one `scripts/accounts-env.sh`
names.

## Pictures

The screenshots and the Share pictures on the site are Walka's own output,
made with its demo mode and a made-up character. The maps on the Share
pictures are drawings made for Walka; how their outlines were made is in
Walka's own
[third-party notices](https://github.com/AntonyPerez0/walka-addon/blob/HEAD/THIRD-PARTY-NOTICES.md#the-continents-on-the-share-picture).

The site's design - its frames, ornaments, icons and backdrops - is drawn
for Walka in CSS and SVG. No artwork, logos, fonts, icons or screenshots
of any game are used.

## Names

Walka is a fan-made tool. It is not affiliated with or endorsed by
Blizzard Entertainment, UREVO, WELLFIT or any other maker of treadmills.
World of Warcraft is a trademark of Blizzard Entertainment, Inc.; the
other names belong to their owners.
