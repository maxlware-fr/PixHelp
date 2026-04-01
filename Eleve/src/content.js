// content.js
let settingsPopup = null;
let certificationBlocked = false;
let currentUrl = location.href;
let intervalId = null;

// ========== BOUTON PIXHELP ==========
function injectButton() {
  const nav = document.querySelector('.app-navigation.pix-navigation .pix-navigation__nav');
  if (nav && !document.getElementById('pixhelp-btn')) {
    const button = document.createElement('button');
    button.id = 'pixhelp-btn';
    button.style.cssText = `
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #3a6ea5;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 8px 12px;
      cursor: pointer;
      font-size: 14px;
      margin-left: 12px;
    `;
    const img = document.createElement('img');
    img.src = chrome.runtime.getURL('icons/icon_active.png');
    img.style.width = '20px';
    img.style.height = '20px';
    const span = document.createElement('span');
    span.textContent = 'PixHelp';
    button.appendChild(img);
    button.appendChild(span);
    button.addEventListener('click', openSettingsPopup);
    nav.appendChild(button);
  }
}

// ========== POPUP PARAMÈTRES ==========
function openSettingsPopup() {
  if (settingsPopup) {
    settingsPopup.remove();
    settingsPopup = null;
    return;
  }

  chrome.storage.sync.get({ enabled: true, teacherCode: '' }, (data) => {
    const isEnabled = data.enabled;
    const teacherCode = data.teacherCode || '';

    const popup = document.createElement('div');
    popup.id = 'pixhelp-settings-popup';
    popup.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border-radius: 16px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      z-index: 10001;
      width: 400px;
      max-width: 90%;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      overflow: hidden;
    `;

    popup.innerHTML = `
      <div style="background: #3a6ea5; padding: 16px; color: white;">
        <h2 style="margin:0; font-size: 20px;">⚙️ Paramètres PixHelp</h2>
      </div>
      <div style="padding: 20px;">
        <div style="display: flex; gap: 10px; border-bottom: 1px solid #eee; margin-bottom: 16px;">
          <button class="tab-btn active" data-tab="info">ℹ️ Infos</button>
          <button class="tab-btn" data-tab="options">⚙️ Options</button>
        </div>
        <div id="tab-info" class="tab-content active">
          <p><strong>PixHelp</strong> – Assistant pour la plateforme Pix.</p>
          <p>Cette extension vous aide à trouver des ressources pédagogiques (tutoriels, forums, documentation) pour les épreuves Pix.</p>
          <p>Version 1.0.0</p>
          <p>© 2026 - Développé par Maxlware pour aider les élèves.</p>
        </div>
        <div id="tab-options" class="tab-content" style="display:none;">
          <label style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">
            <input type="checkbox" id="pixhelp-enabled" ${isEnabled ? 'checked' : ''}>
            <span>Activer l'extension</span>
          </label>
          <div style="margin-top: 20px;">
            <label style="font-weight: bold;">👨‍🏫 Code professeur (en développement) :</label>
            <input type="text" id="teacher-code" style="width: 100%; padding: 8px; margin-top: 5px; border-radius: 4px; border: 1px solid #ccc;" value="${teacherCode.replace(/["\\]/g, '\\$&')}" disabled>
            <p style="font-size: 11px; color: #666; margin-top: 5px;">Fonctionnalité à venir – restez connecté !</p>
          </div>
        </div>
        <div style="margin-top: 20px; text-align: right;">
          <button id="pixhelp-close" style="background: #3a6ea5; border: none; color: white; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Fermer</button>
        </div>
      </div>
    `;

    document.body.appendChild(popup);
    settingsPopup = popup;

    // Onglets
    const tabBtns = popup.querySelectorAll('.tab-btn');
    const tabContents = {
      info: popup.querySelector('#tab-info'),
      options: popup.querySelector('#tab-options')
    };
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        Object.keys(tabContents).forEach(key => {
          tabContents[key].style.display = key === tab ? 'block' : 'none';
        });
      });
    });

    // Activation
    const checkbox = popup.querySelector('#pixhelp-enabled');
    checkbox.addEventListener('change', (e) => {
      chrome.storage.sync.set({ enabled: e.target.checked });
    });

    // Fermeture
    const closeBtn = popup.querySelector('#pixhelp-close');
    closeBtn.addEventListener('click', () => {
      popup.remove();
      settingsPopup = null;
    });

    window.addEventListener('click', (e) => {
      if (settingsPopup && !popup.contains(e.target)) {
        popup.remove();
        settingsPopup = null;
      }
    });
  });
}

// ========== BLOCAGE CERTIFICATION ==========
function blockCertificationSection() {
  chrome.storage.sync.get({ enabled: true }, (data) => {
    if (!data.enabled) return;

    if (!window.location.pathname.startsWith('/certifications')) {
      cleanupCertificationBlock();
      return;
    }

    const target = document.querySelector('.certification-joiner, .pix-block.pix-block--primary.certification-start-page__block');
    if (!target) return;
    if (certificationBlocked) return;

    target.style.filter = 'blur(8px)';
    target.style.pointerEvents = 'none';
    target.classList.add('pixhelp-blurred');

    const message = document.createElement('div');
    message.className = 'pixhelp-warning';
    message.innerHTML = `
      Conformément aux conditions d'utilisations, l'utilisation de cet extension est interdite pendant la certification pour éviter toute tricherie.
      <br><br>
      Vous pouvez soit désactiver l'extension ou la supprimer.
      <br><br>
      <a href="https://pix.fr/conditions-utilisation" target="_blank" style="color: #ffa500; text-decoration: underline;">Conditions d'utilisation</a> | 
      <a href="https://sciences.edu.umontpellier.fr/files/2021/10/Reglement-PIX-2021.pdf" target="_blank" style="color: #ffa500; text-decoration: underline;">Informations complémentaires</a>
    `;
    message.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0,0,0,0.85);
      color: white;
      padding: 16px;
      border-radius: 8px;
      text-align: center;
      max-width: 80%;
      z-index: 10000;
      font-size: 14px;
      pointer-events: auto;
      white-space: normal;
      word-wrap: break-word;
      line-height: 1.4;
    `;

    const parent = target.parentElement;
    if (parent && getComputedStyle(parent).position === 'static') {
      parent.style.position = 'relative';
    }
    parent.appendChild(message);
    certificationBlocked = true;
  });
}

function cleanupCertificationBlock() {
  document.querySelectorAll('.pixhelp-warning').forEach(el => el.remove());
  const targets = document.querySelectorAll('.certification-joiner, .pix-block.pix-block--primary.certification-start-page__block');
  targets.forEach(target => {
    target.style.filter = '';
    target.style.pointerEvents = '';
    target.classList.remove('pixhelp-blurred');
  });
  certificationBlocked = false;
}

// ========== SURVEILLANCE DES CHANGEMENTS D'URL ==========
function startMonitoring() {
  if (intervalId) clearInterval(intervalId);
  intervalId = setInterval(() => {
    if (location.href !== currentUrl) {
      currentUrl = location.href;
      cleanupCertificationBlock();
      createFloatingButton(); // recrée le bouton IA après changement de page
    }
    blockCertificationSection();
  }, 500);
}

// ========== ASSISTANT RESSOURCES ==========
function getMode() {
  const modeElement = document.querySelector('.tooltip-tag-information__title');
  if (!modeElement) return null;
  return modeElement.textContent.trim();
}

function getQuestion() {
  const questionElement = document.querySelector('.challenge-statement-instruction__text p');
  return questionElement ? questionElement.textContent.trim() : '';
}

let chatWindow = null;
let disabledMessageTimeout = null;

function showDisabledMessage() {
  // Supprimer l'ancien message s'il existe
  const oldMsg = document.getElementById('pixhelp-disabled-msg');
  if (oldMsg) oldMsg.remove();
  if (disabledMessageTimeout) clearTimeout(disabledMessageTimeout);

  const msg = document.createElement('div');
  msg.id = 'pixhelp-disabled-msg';
  msg.textContent = '⛔ Assistant désactivé sur cette page. Veuillez passer en Mode Libre pour l’utiliser.';
  msg.style.cssText = `
    position: fixed;
    bottom: 90px;
    right: 20px;
    background: #f44336;
    color: white;
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 12px;
    z-index: 10003;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    animation: fadeInOut 3s ease-in-out forwards;
  `;
  document.body.appendChild(msg);

  disabledMessageTimeout = setTimeout(() => {
    if (msg && msg.remove) msg.remove();
  }, 3000);
}

function createFloatingButton() {
  const oldBtn = document.getElementById('pixhelp-ai-btn');
  if (oldBtn) oldBtn.remove();

  const mode = getMode();
  const isLibre = mode === 'Mode Libre';

  const btn = document.createElement('div');
  btn.id = 'pixhelp-ai-btn';
  btn.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background-color: #3a6ea5;
    cursor: pointer;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10001;
    transition: transform 0.2s, opacity 0.2s;
  `;
  btn.innerHTML = `<img src="${chrome.runtime.getURL('icons/help.png')}" style="width: 32px; height: 32px;">`;

  if (!isLibre) {
    btn.style.opacity = '0.5';
    btn.style.cursor = 'pointer';
    btn.title = 'Assistant désactivé en Mode Focus';
    btn.addEventListener('click', showDisabledMessage);
  } else {
    btn.addEventListener('click', () => toggleChat());
  }

  document.body.appendChild(btn);
}

function toggleChat() {
  if (chatWindow) {
    // Animation de fermeture
    chatWindow.style.animation = 'slideDown 0.2s ease-in forwards';
    setTimeout(() => {
      chatWindow.remove();
      chatWindow = null;
    }, 200);
    return;
  }

  chatWindow = document.createElement('div');
  chatWindow.id = 'pixhelp-chat';
  chatWindow.style.cssText = `
    position: fixed;
    bottom: 90px;
    right: 20px;
    width: 340px;
    height: 480px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 8px 20px rgba(0,0,0,0.2);
    display: flex;
    flex-direction: column;
    z-index: 10002;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    overflow: hidden;
    animation: slideUp 0.2s ease-out;
  `;

  chatWindow.innerHTML = `
    <div style="background: #3a6ea5; color: white; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center;">
      <span style="font-weight: bold;">📚 Assistant PixHelp</span>
      <button id="close-chat" style="background: none; border: none; color: white; cursor: pointer; font-size: 18px;">✕</button>
    </div>
    <div id="chat-messages" style="flex: 1; overflow-y: auto; padding: 12px; background: #f9fafc;">
      <div style="text-align: center; color: #6c86a3; font-size: 12px; margin-bottom: 12px;">
        💡 Posez une question sur l'épreuve. Je vous trouverai des ressources utiles (tutoriels, forums, documentation).
      </div>
    </div>
    <div style="padding: 12px; border-top: 1px solid #e2e8f0; display: flex; gap: 8px;">
      <input id="chat-input" type="text" placeholder="Ex: Comment utiliser un tableur ?" style="flex: 1; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 24px; outline: none;">
      <button id="send-chat" style="background: #3a6ea5; border: none; color: white; border-radius: 24px; padding: 8px 16px; cursor: pointer;">Envoyer</button>
    </div>
  `;

  document.body.appendChild(chatWindow);

  // Ajout des animations CSS
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes slideDown {
      from { opacity: 1; transform: translateY(0); }
      to { opacity: 0; transform: translateY(20px); }
    }
    @keyframes fadeInOut {
      0% { opacity: 0; transform: translateY(10px); }
      15% { opacity: 1; transform: translateY(0); }
      85% { opacity: 1; transform: translateY(0); }
      100% { opacity: 0; transform: translateY(-10px); visibility: hidden; }
    }
  `;
  document.head.appendChild(style);

  const closeBtn = chatWindow.querySelector('#close-chat');
  closeBtn.addEventListener('click', () => {
    // Animation de fermeture
    chatWindow.style.animation = 'slideDown 0.2s ease-in forwards';
    setTimeout(() => {
      chatWindow.remove();
      chatWindow = null;
    }, 200);
  });

  const sendBtn = chatWindow.querySelector('#send-chat');
  const input = chatWindow.querySelector('#chat-input');

  const addMessage = (content, isUser) => {
    const messagesDiv = chatWindow.querySelector('#chat-messages');
    const msgDiv = document.createElement('div');
    msgDiv.style.cssText = `
      margin-bottom: 12px;
      display: flex;
      justify-content: ${isUser ? 'flex-end' : 'flex-start'};
    `;
    const isHtml = !isUser && typeof content === 'string' && content.includes('<');
    if (isHtml) {
      msgDiv.innerHTML = `
        <div style="
          max-width: 80%;
          background: ${isUser ? '#3a6ea5' : '#e9ecef'};
          color: ${isUser ? 'white' : 'black'};
          padding: 8px 12px;
          border-radius: 18px;
          word-wrap: break-word;
        ">${content}</div>
      `;
    } else {
      msgDiv.innerHTML = `
        <div style="
          max-width: 80%;
          background: ${isUser ? '#3a6ea5' : '#e9ecef'};
          color: ${isUser ? 'white' : 'black'};
          padding: 8px 12px;
          border-radius: 18px;
          word-wrap: break-word;
        ">${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
      `;
    }
    messagesDiv.appendChild(msgDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  };

  const sendMessage = async () => {
    const userMessage = input.value.trim();
    if (!userMessage) return;
    addMessage(userMessage, true);
    input.value = '';

    // Indicateur de recherche
    const typingDiv = document.createElement('div');
    typingDiv.id = 'typing-indicator';
    typingDiv.style.cssText = 'margin-bottom: 12px; display: flex; justify-content: flex-start;';
    typingDiv.innerHTML = '<div style="background: #e9ecef; padding: 8px 12px; border-radius: 18px;">🔍 Recherche de ressources...</div>';
    const messagesDiv = chatWindow.querySelector('#chat-messages');
    messagesDiv.appendChild(typingDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    try {
      const links = await getResources(userMessage);
      typingDiv.remove();

      const linksHtml = links.map(link => `
        <div style="margin-bottom: 8px;">
          <a href="${link.url}" target="_blank" style="color: #3a6ea5; text-decoration: none; display: inline-block; padding: 4px 0;">
            ${link.title}
          </a>
        </div>
      `).join('');

      addMessage(`
        <div>
          <strong>📖 Ressources suggérées :</strong><br>
          ${linksHtml}
          <hr style="margin: 8px 0;">
          <small style="color: #6c86a3;">Cliquez sur un lien pour l'ouvrir dans un nouvel onglet.</small>
        </div>
      `, false);
    } catch (error) {
      typingDiv.remove();
      addMessage('❌ Erreur : ' + error.message, false);
    }
  };

  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
}

async function getResources(userMessage) {
  const question = getQuestion();
  const context = { question: question };
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({
      action: 'getResources',
      question: userMessage,
      context: context
    }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else if (response.error) {
        reject(new Error(response.error));
      } else {
        resolve(response.links);
      }
    });
  });
}

// ========== INITIALISATION ==========
const navObserver = new MutationObserver(() => injectButton());
navObserver.observe(document.body, { childList: true, subtree: true });
injectButton();
startMonitoring();
createFloatingButton();