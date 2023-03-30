/**
 * UIKit modals
 *
 * @requires UIKit styles and scripts
 * @version 1.0.0
 * author Christoph Thelen aka @kixe
 *
 * @changelog 1.0.0 init 2023-03-30
 *
 */
 
jQuery(document).ready(function() {

	const defaultModalPath = '/global/modals/';	
	const defaultPlaylistPath = '/global/playlists/';

	/**
	 * Convert dashed string to camelCase string
	 *
	 */  
	function dashToCamelCase(string) { 
		return string.toLowerCase().replace(/-(.)/g, function(match, group) {
			return group.toUpperCase();
		});
	}
	
	const ukModalClasses = [
		'uk-modal-alert',
		'uk-modal-confirm',
		'uk-modal-info',
		'uk-modal-prompt',
		'uk-modal-page',
		'uk-modal-audio',
		'uk-modal-cat3dap',
		'uk-modal-video',
		'uk-modal-vimeo',
		'uk-modal-youtube',
		'uk-modal-pdf'
	];

	/**
	 * trigger modal
	 *
	 * .uk-modal-alert (TEXT)
	 * .uk-modal-confirm (TEXT, LABELS)
	 * .uk-modal-info (TEXT)
	 * .uk-modal-prompt [FIELDS]
	 * .uk-modal-page (ID)
	 * .uk-modal-audio [URL,ID]
	 * .uk-modal-cat3dap (URL)
	 * .uk-modal-video (URL)
	 * .uk-modal-vimeo (ID)
	 * .uk-modal-youtube (ID)
	 * .uk-modal-pdf (URL)
	 *
     */
	UIkit.util.on("a[class*='uk-modal-'],button[class*='uk-modal-']", 'click', function (e) {
	
		let validUkModalClass = false;
		for ( var i = 0; i < ukModalClasses.length; i++ ) {
			if ( $(this).hasClass( ukModalClasses[i] ) ) {
				validUkModalClass = true;	
				break;  
			}
		}
		
		// quick exit
		if (!validUkModalClass) return;
		
		/**
		 * Default vars
		 *
		 */ 
		let vars = {
			dataTitle: '', // any (optional)
			dataText: '',
			dataLabelConfirm: config.labelOk,
			dataLabelCancel: config.labelCancel,
			dataFunction: '',
			dataFunctionConfirmed: '', // type confirm
			dataFunctionRejected: '',
			dataPromptLabel: '', // type prompt
			dataPromptPlaceholder: '', // type prompt
			// dataPromptFields: [], // type prompt mulitple??		
			dataId: 0, // page, youtube, vimeo
			dataFile: '',// type audio, file url
			dataUrl: '', // type page, cat3da, video
			dataClass: '', // css class added to outer modal container
			dataPost: [], // type page (param fn.modalPage(data) valid json object)
			
			// runtime array of audio files
			audioList: [],
		}
		
		const fn = {
		
			/**
			 * Cycle over each attribute on the element update vars object
			 *
			 */ 
			setVars: function (obj, e) {
				for (var i = 0; i < e.attributes.length; i++) {
					// Store reference to current attr
					attr = e.attributes[i];
					// If attribute nodeName starts with 'data-'
					if (/^data-/.test(attr.nodeName)) {
						prop = dashToCamelCase(attr.nodeName);				
						if (prop == 'dataPost') {
							const jsonObj = JSON.parse(attr.nodeValue);
							obj[prop] = jsonObj;
						} else {
							obj[prop] = attr.nodeValue;
						}
					} 
				}
			},
		
			/**
			 * add css class to outer uk-modal div element or inner dialog element if exists
			 * inner dialog class used by video and audio / howler
			 * outer can be set for eds, info or page (NOT:  alert, confirm, prompt, audio, video, cat3da, pdf)
			 *
			 */
			addClass: function (obj, cls, inner = false) {
				const el = obj.$el; // outer div .uk-modal
				if (inner === false) {
					el.attributes.class.value += ' ' + cls;
					return;
				}
				const dialog = el.querySelector('.uk-modal-dialog');
				if (dialog) {
					dialog.attributes.class.value += ' ' + cls;
				}
			},

			/**
			 * Dialog to get external data source agreement,
			 * check if cookie is present,
			 * set cookie
			 *   
			 * TODO: allow css classes for containers / buttons
			 *
			 */
			 edsModal: function (func) {
			 			 
				let edsaTitle = vars.dataTitle? vars.dataTitle : config.edsaTitle;
				let edsaText = vars.dataText? vars.dataText : config.edsaText;
				
				let markup = '<button class="uk-modal-close-default" type="button" uk-close></button><form><div class="uk-modal-header"><h2 class="uk-modal-title">' + edsaTitle + '</h2></div><div class="uk-modal-body" uk-overflow-auto><p>' + edsaText + '</p></div><div class="uk-modal-footer uk-text-right"><button class="uk-button uk-button-default uk-button-cancel uk-modal-close" type="button">' + vars.dataLabelCancel + '</button><button class="uk-button uk-button-primary uk-button-ok" autofocus>' + vars.dataLabelConfirm + '</button></div></form>';		
				if (!!$.cookie('eu-cookie') === false) {
					const obj = UIkit.modal.dialog(markup);
					const el = obj.$el; // outer div .uk-modal		
					const ok = el.querySelector('.uk-button-ok');
					const cancel = el.querySelector('.uk-button-cancel');
					// link to modal page from inside modal (type page and post request only)
					const modalLinks = el.querySelectorAll("a[class*='uk-modal-page'],button[class*='uk-modal-page']").forEach( function(item) {
						item.addEventListener('click', function(e) {
							e.preventDefault();
							// vars.dataId = e.srcElement.getAttribute('data-id');
							let data = JSON.parse(e.srcElement.getAttribute('data-post'));
							return fn.modalPage(data);			
						});
					});
					// add a class to outer div uk-modal e.g. .uk-modal-container
					if (vars.dataClass) this.addClass(obj, vars.dataClass);		
					ok.addEventListener('click', function (e) {
						e.preventDefault();
						$.cookie('eu-cookie', '1', { expires: 90, path: '/', secure: false});
						console.log('EU Cookie confirmed.');
						fn[func](); 
					});
				} else {
					this[func]();
				}
			},
	
			/**
			 * type alert
			 * vars.dataText
			 * vars.dataFunction
			 *
			 */
			modalAlert: function () {
				let obj = UIkit.modal.alert(vars.dataText);
				if (vars.dataFunction !== '') {
					let func = this[vars.dataFunction];
					obj.then(func);
				}
				return obj;
			},
	
			/**
			 * type confirm
			 * vars.dataText
			 * vars.dataFunctionConfirm
			 * vars.dataFunctionCancel
			 *
			 */
			modalConfirm: function () {
				let obj = UIkit.modal.confirm(vars.dataText);
				if (vars.dataFunctionConfirm !== '') {
					let succ = this[vars.dataFunctionConfirm];
					if (vars.dataFunctionCancel == '') {
						let rej = this[vars.dataFunctionCancel];
						obj.then(succ, rej);
					}
					else {
						obj.then(succ);
					}
				}
				return obj;
			},
		 
			/**
			 * type dialog
			 * vars.dataText
			 * vars.dataTitle
			 * used by type page
			 *
			 */
			modalInfo: function() {
				let closeFullButtonClass = 'uk-modal-close-default';
				if (vars.dataClass.includes('uk-modal-full')) {
					closeFullButtonClass = 'uk-modal-close-full uk-close-large';
				}
				let header = vars.dataTitle? '<div class="uk-modal-header"><h2 class="uk-modal-title">' + vars.dataTitle + '</h2></div>' : '';
				let markup = '<button class="' + closeFullButtonClass + '" type="button" uk-close></button>' + header + '<div class="uk-modal-body" uk-overflow-auto><p>' + vars.dataText + '</p></div>';
				const obj = UIkit.modal.dialog(markup);
				if (vars.dataClass) this.addClass(obj, vars.dataClass);
				return obj;
			},
	
			/**
			 * type prompt
			 * vars.dataText
			 * vars.dataLabelPrompt
			 * vars.dataLabelPlaceholder
			 * vars.dataFunction
			 *
			 */
			 modalPrompt: function() {
				let obj = UIkit.modal.prompt(vars.dataPromptLabel, vars.dataPromptPlaceholder);
				if (vars.dataClass) this.addClass(obj, vars.dataClass);
				if (vars.dataFunction !== '') {
					let func = this[vars.dataFunction];
					obj.then(func);
				}
				return obj;
			},
	
			/**
			 * type page
			 *
			 */
			modalPage: function (data) {				
				let url = config.host + config.locale + defaultModalPath + "?id=" + vars.dataId;
				data = (typeof data !== 'undefined') ?  data : null;
				$.ajax({
					type: 'POST',
					url: url,
					data: data,
					success: function (responseData) {
						vars.dataTitle = responseData.title;
						vars.dataText = responseData.text;
						if (responseData.class) vars.dataClass = responseData.class;
						return fn.modalInfo();
					},
					error: function (xhr) {
						alert('Failed to get data. Url: ' + url + ', Request Status: ' + xhr.status + ', Status Text: ' + xhr.statusText + ', Response Text: ' + xhr.responseText);
						return false;
					}
				});
			},
			
			/**
			 * render ISO time string
			 * max value 23:59:59
			 *
			 */
			 renderTimeString: function (sec) {
				sec = Math.round(sec);
				if (sec >= 86400) {
					alert('Cannot render duration time string [' + sec + 'sec] – too long!');
					return '–:–';
				}
			    let date = new Date(0);
				date.setSeconds(sec);
				let start = 15; // 1:00
				if (sec >= 36000) { // 10:00:00
					let start = 11;
				} else if (sec >= 3600) { // 1:00:00
					let start = 12;					
				} else if (sec >= 360) { // 10:00
					let start = 14;					
				}
				return date.toISOString().substring(start, 19);	  			
			},

			/**
			 * type audio
			 * render audio player
			 * init howler.js
			 * @see https://github.com/goldfire/howler.js#documentation
			 *
			 */
			modalAudio: function () {
				
				// get playlist
				let url = '';
				// single audio file url
				if (vars.dataFile) {
					if (vars.dataFile.startsWith('{')) {
						vars.audioList = JSON.parse(vars.dataFile);
					} else {
						let parts = vars.dataFile.split(/[\/\.]+/);
						let key = parts[parts.length - 2];
						vars.audioList = {[key]:vars.dataFile};
					}
					return fn.initHowler();
				}
				else {
					// playlist URL return JSON string by ajax call
					if (vars.dataUrl) {
						url = vars.dataUrl;
					}
					// PW page ID holding playlist return JSON string by ajax call
					else if (vars.dataId) {
						url = config.host + config.locale + defaultPlaylistPath + "?id=" + vars.dataId;
					}
					// console.log(url);
					if (url) {
						$.ajax({
							type: 'GET',
							url: url,
							data: null,
							success: function (responseData) {
								vars.audioList = responseData;
								vars.dataFile = '';
								vars.dataUrl = '';
								vars.dataId = 0;
								return fn.initHowler();								// console.log(vars.audioList);
							},
							error: function (xhr) {
								if (xhr.status == 0 || xhr.statusText == 'error') {
									alert('Failed to get data. URL: ' + url + ', Invalid URL or broken data connection.');			
								} else {
									// dev
									// alert('Failed to get data. Url: ' + url + ', Request Status: ' + xhr.status + ', Status Text: ' + xhr.statusText + ', Response Text: ' + xhr.responseText);
									alert('Failed to get data. URL: ' + url + ', Request Status: ' + xhr.status + ', Status Text: ' + xhr.statusText + '. invalid URL or broken data connection.');
								}
								return false;
							}
						});
					}
				}
			},
				
			initHowler: function() {
				
				// build HTML
			    const audioUI = this.renderAudioUI();
				let audioId = 1;
				let audioIndex = 1;			
				let list = '';
				let count = 0;
				for(let title in vars.audioList) {
					count++;
					list += this.renderAudioListItem(title, vars.audioList[title], count);
				}
				let markup = '<button class="uk-modal-close-default audio-close-' + audioId + '" type="button" uk-close></button><div class="audio-container"></div><ul id="audio-playlist-' + audioId + '" data-index="' + audioIndex + '" class="uk-list audio-playlist">' + list + '</ul>';	   
				const obj = UIkit.modal.dialog(markup);
				const el = obj.$el; // outer div .uk-modal		    
			    const audioContainer = el.querySelector('.audio-container');
				audioContainer.appendChild(audioUI);				
				let cls = vars.dataClass;
				// outer css class
				// this.addClass(obj, cls);
				// inner css class
				cls = 'uk-modal-body uk-margin-auto-vertical';
				this.addClass(obj, cls, true);

			    // init howler.js
			    let playedTime = null;
			    let activeItem = el.querySelector('.audio-playlist li:first-child');
			    let loadedBytes = 0;
			    const sound = new Howl({
			    
			    	// load in first track
			    	
			    	html5: true,
			    	xhr: {
						method: 'GET',
					},
			    	src: Object.values(vars.audioList)[0],
			    	preload: true,
			    	autoplay: true,
			    	volume: 0.01,
			    	onunlock: function() {

			    	},
			    	onload: function() {
			    		loadedBytes = setInterval(function() {
			    			// sound._xhr
			    			// sound._sounds[0].addEventListener('create', function(e) {
			    			// console.log(sound._sounds[0]._node);
			    			console.log(sound._sounds[0]._loadFn());
			    			console.log(sound.progress);
			    			// console.log(sound._sounds[0]._node.buffered.length);
			    			
			    			// });
			    			// console.log(sound._sounds[0]); 
			    			// console.log(new Date().getTime());		
			    		},500);
			    		let previousItem = activeItem;	    		  		
			    		activeItem = el.querySelector('a[data-src="' + this._src + '"]').parentNode;
			    		if (activeItem !== previousItem) {
			    			previousItem.classList.remove("active");
			    		}
			    		activeItem.classList.add("active");
			    		activeItem.classList.remove("loading");
			    		clearInterval(playedTime);
			    		audioUI.classList.remove("loading");
			    		audioUI.querySelector('.played').innerHTML = fn.renderTimeString(0);
			    		audioUI.querySelector('.duration').innerHTML = fn.renderTimeString(this.duration());
			    		audioUI.querySelector('.loaded').setAttribute("style", "width:100%;"); // loading pogress?
			    	},
			    	onplay: function(id) {
			    		activeItem.classList.add("playing");
			    		playedTime = setInterval(function() {
			    			audioUI.querySelector('.played').innerHTML = fn.renderTimeString(sound.seek(null,id));
			    			let progress = Math.round(sound.seek(null,id) / sound.duration() * 100);
			    			audioUI.querySelector('.progress').setAttribute("style", "width:" + progress + "%;");
			    		}, 1000);
			    		audioUI.classList.add("playing");
			    		audioUI.classList.remove("loading"); // ?
			    		audioUI.setAttribute("data-sound-id", id);
			    	},
			    	onstop: function(id) {		    	
			    		clearInterval(playedTime);
			    		audioUI.classList.remove("playing");
			    		activeItem.classList.remove("playing");
			    	},
			    	onpause: function(id) {
			    		clearInterval(playedTime);
			    		audioUI.classList.remove("playing");
			    		activeItem.classList.remove("playing");
			    	},
			    	onend: function(id) {
			    		clearInterval(playedTime);
			    		clearInterval(loadedBytes);
			    		audioUI.classList.remove("playing");
			    		activeItem.classList.remove("playing");
			    		audioUI.querySelector('.progress').setAttribute("style", "width: 0;");
			    		audioUI.querySelector('.played').innerHTML = fn.renderTimeString(0);
			    		this.seek(0, id);
			    	},
			    	onloaderror: function (id, code) {
			    		clearInterval(playedTime);
			    		clearInterval(loadedBytes);
			    		audioUI.querySelector('.error-message p').innerHTML = "ERROR[1]:\n" + code + " [" + id + "]";
						audioUI.classList.remove("loading");
			    		audioUI.classList.remove("playing");
			    		audioUI.classList.add("error");
			    		activeItem.classList.remove("playing");
			    		activeItem.classList.remove("active");		    		
						$(activeItem).siblings().removeClass("error");
						$(activeItem).siblings().removeClass("active");
						$(activeItem).siblings().removeClass("loading");

			    		// audioUI.querySelector('.played').innerHTML = '–:–';
			    		// audioUI.querySelector('.duration').innerHTML = '–:–';
			    		
						/**
						 * https://github.com/goldfire/howler.js#onloaderror-function
						 * https://developer.mozilla.org/en-US/docs/Web/API/MediaError/code
						 *
						 *
						switch(code) {
							case 1:
								alert('The fetching process for the media resource was aborted by the user agent at the user\'s request.');
								break; 
							case 2:
								alert('A network error of some description caused the user agent to stop fetching the media resource, after the resource was established to be usable.');
								break;
							case 3:
								alert('An error of some description occurred while decoding the media resource, after the resource was established to be usable.');
								break;
							case 4:
								alert('The media resource indicated by the src attribute or assigned media provider object was not suitable.');
								break;
						}
						*/
						
					},
					onplayerror: function (id, code) {
						clearInterval(playedTime);
						clearInterval(loadedBytes);
						audioUI.querySelector('.error-message p').innerHTML = "ERROR[2]:\n" + code + " [" + id + "]";
						audioUI.classList.remove("loading");
			    		audioUI.classList.remove("playing");
			    		audioUI.classList.add("error");
			    		activeItem.classList.remove("playing");
			    		activeItem.classList.remove("active");
			    		$(activeItem).siblings().removeClass("error");
						$(activeItem).siblings().removeClass("active");
						$(activeItem).siblings().removeClass("loading");

			    		// audioUI.querySelector('.played').innerHTML = '–:–';
			    		// audioUI.querySelector('.duration').innerHTML = '–:–';
					}, 			    	
			    });
			    
				// add event handler to controls: play, pause, position
				audioUI.querySelector('.play').addEventListener('click', function() {
					if (sound.playing()) {
						sound.pause();
					} else {
						sound.play();		    		
					}
				});	
				audioUI.querySelector('.pause').addEventListener('click', function() {
					if (sound.playing()) {
						sound.pause();
					} else {
						sound.play();		    		
					}
				});
				audioUI.querySelector(".scrubber").addEventListener("click", function(e) {
					let scrubberBox = this.getBoundingClientRect();
					let scrubberWidth = scrubberBox.right - scrubberBox.left;
					let position = Math.floor((e.clientX - scrubberBox.left) / scrubberWidth * 100); // 0 - 100;
					let seek = position / 100 * sound.duration();
					audioUI.querySelector('.progress').setAttribute("style", "width:" + position + "%;");
					sound.seek(seek);
				});
				
				// add event handler to playlist
				el.querySelectorAll('.audio-playlist li').forEach( function(item) {
					item.addEventListener('click', function(e) {	
						e.preventDefault();	
						if ($(audioUI).hasClass('error')) {
							$(this).removeClass("active");
							$(this).removeClass("loading");
							$(this).siblings().removeClass("error");
							$(this).siblings().removeClass("active");
							$(this).siblings().removeClass("loading");
							$(this).addClass("error");							
						}
						else if ($(this).hasClass('loading')) {
							// still loading, do nothing, just wait ...
						}
						else if (this == activeItem) {					
							if ($(this).hasClass('playing')) {
								sound.pause();
							} else {
								sound.play();
							}
						} else {
							$(this).siblings().not(this).removeClass("active");
							$(this).siblings().removeClass("loading");
							$(this).siblings().removeClass("error");
							$(this).addClass("active");
							$(this).addClass("loading");
							// change track
							let src = $('a', this).attr('data-src');
							sound.stop();
							sound.unload(true);
							sound._src = [src];					
							sound.load();
							sound.play();
						} 
					});
				});

				// stop sound on modal close
				el.addEventListener('beforehide', function () { 
					clearInterval(loadedBytes);
					sound.unload();
				});
				return obj;
			},
			
			/**
			 * render player HTML
			 * require css
			 *
			 */
			renderAudioUI: function() {
						
				const audioPlayer = document.createElement("div");				
				const audioControls = document.createElement("div");
				const audioBar = document.createElement("div");
				const audioTime = document.createElement("div");
				const audioError = document.createElement("div");			
				const audioControlsPlay = document.createElement("p");
				const audioControlsPause = document.createElement("p");
				const audioControlsLoading = document.createElement("p");
				const audioControlsError = document.createElement("p");
				const audioBarProgress = document.createElement("div");
				const audioBarLoaded = document.createElement("div");			
				const audioTimePlayed = document.createElement("em");
				const audioTimeDuration = document.createElement("strong");
				const audioErrorMessage = document.createElement("P");
				
				audioPlayer.setAttribute("class","audioplayer");
				audioPlayer.setAttribute("data-sound-id",0);
				
				audioControls.setAttribute("class","play-pause");
				audioBar.setAttribute("class","scrubber");
				audioTime.setAttribute("class","time");
				audioError.setAttribute("class","error-message");
				
				audioControlsPlay.setAttribute("class","fa fa-play play");
				audioControlsPause.setAttribute("class","fa fa-pause pause");
				audioControlsLoading.setAttribute("class","fa fa-cirle-o-notch fa-spin loading");
				audioControlsError.setAttribute("class","fa fa-times error");
				
				audioBarProgress.setAttribute("class","progress");
				audioBarLoaded.setAttribute("class","loaded");
				
				audioTimePlayed.setAttribute("class","played");
				audioTimeDuration.setAttribute("class","duration");
		
				audioPlayer.appendChild(audioControls);
				audioPlayer.appendChild(audioBar);
				audioPlayer.appendChild(audioTime);
				audioPlayer.appendChild(audioError);
				
				audioControls.appendChild(audioControlsPlay);
				audioControls.appendChild(audioControlsPause);
				audioControls.appendChild(audioControlsLoading);
				audioControls.appendChild(audioControlsError);
				
				audioBar.appendChild(audioBarProgress);
				audioBar.appendChild(audioBarLoaded);
				
				audioTime.appendChild(audioTimePlayed);
				audioTime.appendChild(audioTimeDuration);
				
				audioError.appendChild(audioErrorMessage);
				
				return audioPlayer;
			},
						
			/**
			 * return string
			 *
			 */
			renderAudioListItem: function(title, url, num) {
				return '<li><a href="' + url + '" title="' + title + '" data-src="' + url + '"><span>' + num + '.</span> <span>' + title + '</span> <i class="icon"><span class="audio-loading-spinner"></span></i></a></li>';
			},

			/**
			 * type cat3da
			 *
			 */
			modalCat3dap: function () {
				const hosts = config.cat3daHosts.join(' ');
				const host = config.cat3daHosts[config.cat3daHosts.length * Math.random() | 0];
				let preset = decodeURIComponent(vars.dataUrl.split('preset=').pop());
				if (preset == vars.dataUrl && preset.indexOf("https://") == 0) {
					preset = 'Demo';
				} else if (preset.indexOf("&")) {
					preset = preset.split('&')[0];
				}
				preset = preset? encodeURIComponent(preset) : 'Demo';
				let markup = '<button class="uk-modal-close-outside" type="button" uk-close></button><iframe width="400" height="628" src="' + host + '?preset=' + preset + '" frameborder="0" allow="camera ' + hosts + '"></iframe>';		
				return this.modalVideo(markup);
			},
	 
			/**
			 * type video
			 *
			 * vars.dataUrl e.g. https://yootheme.com/site/images/media/yootheme-pro.mp4
			 */
			modalVideo: function (markup) {
				markup = markup !== undefined ? markup : '<button class="uk-modal-close-outside" type="button" uk-close></button><video src="' + vars.dataUrl + '" width="1920" height="1080" controls playsinline uk-video></video>';		
				const obj = UIkit.modal.dialog(markup);
				const cls = 'uk-width-auto uk-margin-auto-vertical';
				this.addClass(obj, cls, true);
				return obj;
			},
	
			/**
			 * type vimeo
			 * vars.dataId e.g. 346708937
			 *
			 */
			modalVimeo: function () {
				let markup = '<button class="uk-modal-close-outside" type="button" uk-close></button><iframe src="https://player.vimeo.com/video/' + vars.dataId + '" width="1920" height="1080" frameborder="0" allowfullscreen uk-responsive uk-video></iframe>';		
				return this.modalVideo(markup);
			},
	
			/**
			 * type youtube
			 * vars.dataId e.g. c2pz2mlSfXA
			 *
			 */
			modalYoutube: function () {
				let markup = '<button class="uk-modal-close-outside" type="button" uk-close></button><iframe src="https://www.youtube-nocookie.com/embed/' + vars.dataId + '" width="1920" height="1080" frameborder="0" allowfullscreen uk-responsive uk-video></iframe>';		
				return this.modalVideo(markup);
			},
	
			/**
			 * type pdf
			 * vars.dataUrl
			 *
			 */
			 modalPdf: function() {
				let markup = '<button class="uk-modal-close-outside" type="button" uk-close></button><iframe src="' + vars.dataUrl + '" width="1920" height="1080" frameborder="0" uk-responsive></iframe>';		
				return this.modalVideo(markup);
			},
		}
	
		e.preventDefault();
		e.target.blur();
		
		// the <a> or <button> tag
		let aTag = $(this)[0];
		// get data-* attributes	
		fn.setVars(vars, aTag);		
		
		// switch type
		var cls = aTag.classList;
		switch(true) {
			case cls.contains('uk-modal-alert'):
				fn.modalAlert();
				break; 
			case cls.contains('uk-modal-confirm'):
				fn.modalConfirm();
				break;
			case cls.contains('uk-modal-info'):
				fn.modalInfo();
				break;
			case cls.contains('uk-modal-prompt'):
				fn.modalPrompt();
				break; 
			case cls.contains('uk-modal-page'):
				fn.modalPage(vars.dataPost);
				break;   
			case cls.contains('uk-modal-audio'):
				fn.modalAudio();
				break;  
			case cls.contains('uk-modal-cat3dap'):
				fn.modalCat3dap();
				break;
				
			// external data source agreement	
			case cls.contains('uk-modal-video'):
				fn.edsModal('modalVideo');
				break;
			case cls.contains('uk-modal-vimeo'):
				fn.edsModal('modalVimeo');
				break;
			case cls.contains('uk-modal-youtube'):		
				fn.edsModal('modalYoutube');
				break; 
			case cls.contains('uk-modal-pdf'):
				fn.edsModal('modalPdf');
				break; 
		}	
	});
});