function buildHtml() {

	function renderInput(label, id, type, def, info) {
		return `
			<div class="form-floating mb-3">
				<input required type="${type}" class="form-control" id="${id}" name="${id}" placeholder="${label}" value="${def ? def : ''}">
				<label for="${id}">${label}</label>
				${renderInfo(info)}
			</div>
		`
	}

	function renderInfo(info){
		return info ? `<div class="form-text">${info}</div>` : ''
	}

	function checkbox(label, id, def, info) {
		return `
			<div class="form-floating mb-3">
				<div class="form-check">
					<input class="form-check-input" type="checkbox" id="${id}" name="${id}" ${def ? 'checked' : ''}>
					<label class="form-check-label" for="${id}">${label}</label>
					${renderInfo(info)}
				</div>
			</div>
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
	<link rel="stylesheet" href="/static/css/styles.css">
	</link>
	<script type="text/javascript">
		function getValue(name) {
			return document.getElementById(name).value
		}
		function getChecked(name) {
			return document.getElementById(name).checked
		}

		function getFormData(e) {
			var settingsObject = {
				tmdb: {
					enabled: getChecked("tmdbEnabled"),
					mainLang: getValue("tmdbMainLang"),
					fallbackLang: getValue("tmdbFallbackLang"),
				},
				allowExplicit: getChecked("allowExplicit"),
				pageSize: getValue("pageSize"),
				token: btoa(\`\${ getValue("name") }:\${ getValue("password") } \`)
			}

			// Convert object to JSON and encode in base64
			return encodeURIComponent(JSON.stringify(settingsObject));
		}

		document.addEventListener('DOMContentLoaded', function () {

			document.getElementById("tmdbOptinal").style.display = "none"

			document.getElementById("tmdbEnabled").addEventListener('change', function () {
				document.getElementById("tmdbOptinal").style.display = this.checked ? "block" : "none"
			});

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
						${checkbox("TMDB?", "tmdbEnabled", false, "Kvalitnejsie data za cenu dlhsieho nacitania")}

						<div id="tmdbOptinal">
							<div class="form-floating mb-3">
								<select required class="form-select" id="tmdbMainLang" name="tmdbMainLang" aria-label="CZ">
									<option selected value="cs_CZ">CZ</option>
									<option value="sk_SK">SK</option>
									<option value="en_US">EN</option>
								</select>
								<label for="tmdbMainLang">TMDB Primarny jazyk</label>
								<div id="emailHelp" class="form-text">Prvy jazyk pre data</div>
							</div>

							<div class="form-floating mb-3">
								<select required class="form-select" id="tmdbFallbackLang" name="tmdbFallbackLang"
									aria-label="CZ">
									<option value="cs_CZ">CZ</option>
									<option selected value="sk_SK">SK</option>
									<option value="en_US">EN</option>
								</select>
								<label for="tmdbFallbackLang">TMDB Alternativny jazyk</label>
								<div id="emailHelp" class="form-text">Alternativny jazyk v pripade ze prvy nieje kompletny
								</div>
							</div>
						</div>

						${checkbox("Explicitny obsah?", "allowExplicit", false)}
						${renderInput("Pocet filmov na stranke", "pageSize", "number", "10", "Vyssie cislo sposobi pomalsie nacitanie")}

						<div class="d-grid gap-2 mb-3">
							<button type="submit" class="btn btn-primary btn-lg">Instalovat</button>
						</div>

						<div class="form-group mb-3">
							<label class="text-muted" for="formDataDisplay">Kliknite na Instalovat alebo skopirujte tento
								odkaz do Stremio vyhladavania</label>
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