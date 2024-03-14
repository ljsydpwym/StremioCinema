const { settingsLoader } = require('../helpers/settings.js')

function buildHtml() {

	const settings = settingsLoader("token")
	delete settings.token

	//typesafe way for keys to exist, create both line for new keys
	const tmdbEnabled = "tmdbEnabled"
	settings.tmdbEnabled == settings[tmdbEnabled]
	const tmdbMainLang = "tmdbMainLang"
	settings.tmdbMainLang == settings[tmdbMainLang]
	const tmdbFallbackLang = "tmdbFallbackLang"
	settings.tmdbFallbackLang == settings[tmdbFallbackLang]
	const allowExplicit = "allowExplicit"
	settings.allowExplicit == settings[allowExplicit]
	const pageSize = "pageSize"
	settings.pageSize == settings[pageSize]

	function renderInput(label, id, type, def, info) {
		return `
			<div class="form-floating mb-3">
				<input required type="${type}" class="form-control" id="${id}" name="${id}" placeholder="${label}" value="${def ? def : ''}">
				${renderLabel(label, id)}
				${renderInfo(info)}
			</div>
		`
	}

	function renderInfo(info){
		return info ? `<div class="form-text">${info}</div>` : ''
	}

	function renderLabel(label, id){
		return `<label for="${id}">${label}</label>`
	}

	function renderCheckbox(label, id, def, info) {
		return `
			<div class="form-floating mb-3">
				<div class="form-check">
					<input class="form-check-input" type="checkbox" id="${id}" name="${id}" ${def ? 'checked' : ''}>
					${renderLabel(label, id)}
					${renderInfo(info)}
				</div>
			</div>
		`
	}

	function renderSelector(label, id, map, preselected, info) {
		return `
			<div class="form-floating mb-3">
				<select required class="form-select" id="${id}" name="${id}">
					${Object.entries(map).map(entry => `<option value="${entry[0]}" ${entry[0] == preselected ? 'selected' : ''}>${entry[1]}</option>`).join("\n")}
				</select>
				${renderLabel(label, id)}
				${renderInfo(info)}
			</div>
		`
	}

	function connecteVisibility(id, field){
		return `
			document.getElementById("${id}").style.display = "none"

			document.getElementById("${field}").addEventListener('change', function () {
				document.getElementById("${id}").style.display = this.checked ? "block" : "none"
			});
		`
	}

	function resolveValueLoader(key, value){
		switch(typeof value){
			case 'boolean': return `document.getElementById("${key}").checked`
			default: return `document.getElementById("${key}").value`
		}
	}

	function renderFormLoader(){
		return `
			function getFormData(e) {
				var settingsObject = {
					${Object.entries(settings).map(entry => `${entry[0]}: ${resolveValueLoader(entry[0], entry[1])}`).join(",\n")},
					token: btoa(\`\${ getValue("name") }:\${ getValue("password") } \`)
				}
				return encodeURIComponent(JSON.stringify(settingsObject));
			}
		`
	}

	return `
<!DOCTYPE html>
<html lang="en" data-bs-theme="dark">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Stremio Cinema</title>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/5.3.2/js/bootstrap.min.js"
		integrity="sha512-WW8/jxkELe2CAiE4LvQfwm1rajOS8PHasCCx+knHG0gBHt8EXxS6T6tJRTGuDQVnluuAvMxWF4j8SNFDKceLFg=="
		crossorigin="anonymous" referrerpolicy="no-referrer"></script>
	<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/5.3.2/css/bootstrap.min.css"
		integrity="sha512-b2QcS5SsA8tZodcDtGRELiGv5SaKSk1vDHDaQRda0htPYWZ6046lr3kJ5bAAQdpV2mmA/4v0wQF9MyU6/pDIAg=="
		crossorigin="anonymous" referrerpolicy="no-referrer" />
	<link rel="stylesheet" href="/static/css/styles.css"></link>
	<script type="text/javascript">
		function getValue(name) {
			return document.getElementById(name).value
		}
		function getChecked(name) {
			return document.getElementById(name).checked
		}
		${renderFormLoader()}
		document.addEventListener('DOMContentLoaded', function () {
			${connecteVisibility("tmdbOptinal", tmdbEnabled)}
			document.getElementById('theform').onsubmit = function (e) {
				e.preventDefault(); // Prevent the default form submission
				var formData = getFormData(e);
				var launchUrl = 'stremio://' + window.location.host + \`/ 1 / \${ formData } /manifest.json\`
				document.getElementById('formDataDisplay').value = launchUrl;
				console.log(launchUrl);
				// Redirect to app URL
				window.location.href = launchUrl
			};
		});
	</script >

</head >
<body class="d-flex align-items-center" style="min-height: 100vh;">
	<div class="container py-5 my-auto">
		<div class="row justify-content-center">
			<div class="col-md-6">
				<div class="banner mb-3 p-3 text-center">
					<h1>Stremio Cinema</h1>
					<p>v1.0.0</p>
					<p> Ak chcete pomocts s vyvojom alebo vytvorit ticket: <a
						href="https://github.com/ljsydpwym/StremioCinema"><i>GitHub</i></a></p>
				</div>
				<form id="theform">
					${renderInput("Meno", "name", "text")}
					${renderInput("Heslo", "password", "password")}
					${renderCheckbox("TMDB?", tmdbEnabled, settings.tmdbEnabled, "Kvalitnejsie data za cenu dlhsieho nacitania")}
					
					<div id="tmdbOptinal">
						${renderSelector("TMDB Primarny jazyk", tmdbMainLang, {
							"cs-CZ": "CZ",
							"sk-SK": "SK",
							"en-US": "EN",
						}, settings.tmdbMainLang, "Prvy jazyk pre data")}
						${renderSelector("TMDB Alternativny jazyk", tmdbFallbackLang, {
							"cs-CZ": "CZ",
							"sk-SK": "SK",
							"en-US": "EN",
						}, settings.tmdbFallbackLang, "Alternativny jazyk v pripade ze prvy nieje kompletny")}
					</div>

					${renderCheckbox("Explicitny obsah?", allowExplicit, settings.allowExplicit)}
					${renderInput("Pocet filmov na stranke", pageSize, "number", `${settings.pageSize}`, "Vyssie cislo sposobi pomalsie nacitanie")}

					<div class="d-grid gap-2 mb-3">
						<button type="submit" class="btn btn-primary btn-lg">Instalovat</button>
					</div>

					<div class="form-group mb-3">
						<label class="text-muted" for="formDataDisplay">Kliknite na Instalovat alebo skopirujte tento odkaz do Stremio vyhladavania</label>
						<br>
						<textarea disabled class="form-control mb-3" id="formDataDisplay" rows="3"></textarea>
					</div>
				</form>
			</div>
		</div>
	</div>
</body>
</html >
	`
}

module.exports = {
	buildHtml
}