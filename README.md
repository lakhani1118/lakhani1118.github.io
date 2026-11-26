# klakhani.com

Source for [klakhani.com](https://klakhani.com/), the personal site of Karim Lakhani, PhD. It's a single page with About, Experience, Research, Beyond the lab, and Contact sections, hosted on GitHub Pages.

## Structure

| Path | Contents |
| --- | --- |
| `index.html` | The whole page, including inlined SVG icons and meta and link-preview tags |
| `assets/css/style.css` | Site-wide styles |
| `assets/js/site.js` | Mobile nav toggle and scroll-in animations |
| `pasteurization-tables.html` | Food safety times: government pasteurization hold times with a countdown timer (linked as Resources in the nav and from Beyond the lab) |
| `assets/css/pasteurization.css`, `assets/js/pasteurization.js` | That page's styles, table data and timer |
| `files/` | CV and publication PDFs |
| `images/` | Photos, the link-preview image (`og-image.jpg`, 1200×630), and favicons (`favicon_io/`) |
| `CNAME` | Custom domain for GitHub Pages |

There is no build step. Edit the files and push to `master`, and GitHub Pages serves the result.

## Local preview

Open `index.html` in a browser, or serve the folder:

```sh
python -m http.server
```

Then visit <http://localhost:8000>.

## Credits

- **Fonts:** [Newsreader](https://fonts.google.com/specimen/Newsreader) and [Inter](https://fonts.google.com/specimen/Inter), loaded from Google Fonts
- **Icons:** [Font Awesome Free 5](https://fontawesome.com) (CC BY 4.0), inlined as SVG
- **Photos:** see [`images/Image credits.txt`](images/Image%20credits.txt)
