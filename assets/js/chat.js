/* Ask Sudsy — the mascot chat widget.

   The whole widget is built here rather than repeated as markup in four HTML
   files, so there is one copy to maintain. It needs JavaScript to work at all,
   so there is nothing lost by building it in JavaScript.

   Answers currently come from ANSWERS below: the questions that used to sit in
   the "Common questions" section of the home page, matched on keywords. See
   askSudsy() at the bottom for the single place to swap in a real model. */
(function () {
  'use strict';

  var MASCOT = 'assets/img/mascot-placeholder.svg';
  var NAME = 'Sudsy';
  var PHONE = '(555) 019-2847';

  /* Each entry: keywords to match on, and the answer to give. Order matters
     only for ties — the entry matching the most keywords wins. */
  var ANSWERS = [
    {
      keys: ['coin', 'quarter', 'change', 'card', 'pay', 'payment', 'cash', 'credit', 'debit', 'apple pay'],
      text: 'You do not need coins. Our machines take coins if you prefer them, but you can also pay by credit or debit card right at the machine. There is a change machine by the front door if you would rather use quarters.'
    },
    {
      keys: ['help', 'attendant', 'staff', 'someone', 'somebody', 'person', 'alone', 'first time', 'how do i use'],
      text: 'Yes, an attendant is on site every hour we are open. If you are not sure which machine to use or how much soap to add, just ask. We are happy to walk you through it.'
    },
    {
      keys: ['cost', 'price', 'how much', 'expensive', 'cheap', 'rate', 'dollar'],
      text: 'Prices depend on the size of machine you choose, and every price is posted clearly on the machines themselves. The full list is on our <a href="self-service.html">self-service page</a>.'
    },
    {
      keys: ['long', 'take', 'ready', 'same day', 'turnaround', 'wait', 'when', 'pickup', 'pick up'],
      text: 'For wash, dry and fold, most orders dropped off before noon are ready the same day by 6:00pm. Larger orders may take until the next morning, and we will give you a pickup time when you drop off. If you are washing yourself, the dryers finish in about 30 minutes.'
    },
    {
      keys: ['park', 'parking', 'car', 'accessible', 'wheelchair', 'walker', 'step'],
      text: 'There is free parking directly in front of the building, including two accessible spaces beside the entrance. The door is step-free and wide enough for a cart or walker.'
    },
    {
      keys: ['hour', 'open', 'close', 'closing', 'time', 'today', 'sunday', 'weekend', 'late', 'early'],
      text: 'We are open every day from 6:00am to 10:00pm. The last wash goes in at 9:00pm.'
    },
    {
      keys: ['where', 'address', 'location', 'find', 'direction', 'map'],
      text: 'We are at 100 Example Street, Springfield, MO 65804. Our <a href="locations.html">Visit Us page</a> has directions and photos.'
    },
    {
      keys: ['fold', 'drop off', 'dropoff', 'do it for me', 'wash and fold', 'service'],
      text: 'Wash, dry and fold means you leave your bag with us and collect it washed, dried and neatly folded. No sorting, no waiting around. There is more on the <a href="wash-fold.html">wash, dry and fold page</a>.'
    },
    {
      keys: ['big', 'large', 'comforter', 'bedding', 'blanket', 'duvet', 'bulky', 'rug'],
      text: 'Our large washers handle bedding and bulky loads like comforters and blankets, so you do not need to split them across machines.'
    },
    {
      keys: ['wifi', 'wi-fi', 'internet', 'seat', 'sit', 'wait', 'restroom', 'bathroom', 'toilet'],
      text: 'We have free Wi-Fi, clean restrooms, comfortable seating, and a folding table at every station, so it is a comfortable place to wait out a cycle.'
    },
    {
      keys: ['soap', 'detergent', 'bleach', 'softener', 'sensitive', 'scent', 'allerg'],
      text: 'You are welcome to bring your own detergent, and we sell it on site if you forget. If you have a scent or skin sensitivity, tell the attendant and we will use what you prefer.'
    },
    {
      keys: ['hello', 'hi', 'hey', 'howdy', 'good morning', 'good evening'],
      text: 'Hello. Ask me anything about the laundromat: hours, prices, parking, or how wash, dry and fold works.'
    },
    {
      keys: ['thank', 'thanks', 'cheers', 'appreciate'],
      text: 'Any time. Anything else you would like to know?'
    }
  ];

  var FALLBACK =
    'I am not sure about that one. The attendant will know, so give us a call at ' +
    '<a href="tel:+15550192847">' + PHONE + '</a> and ask.';

  var SUGGESTIONS = [
    'What are your hours?',
    'Do I need coins?',
    'How much is a wash?',
    'How long does wash, dry and fold take?'
  ];

  /* ---------- Matching ---------- */

  function bestAnswer(question) {
    var q = ' ' + question.toLowerCase().replace(/[^a-z0-9\s]/g, ' ') + ' ';
    var best = null;
    var bestScore = 0;

    for (var i = 0; i < ANSWERS.length; i++) {
      var score = 0;
      for (var k = 0; k < ANSWERS[i].keys.length; k++) {
        if (q.indexOf(ANSWERS[i].keys[k]) !== -1) score++;
      }
      if (score > bestScore) {
        bestScore = score;
        best = ANSWERS[i];
      }
    }
    return best ? best.text : FALLBACK;
  }

  /* ---------- Building the widget ---------- */

  var panel, log, input, launcher, form;
  var open = false;
  var closeTimer = null;
  var REDUCED_MOTION = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var CLOSE_DELAY = REDUCED_MOTION ? 0 : 340; /* matches the .chat-panel transform transition */

  function el(tag, className, html) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (html != null) node.innerHTML = html;
    return node;
  }

  function build() {
    launcher = el('button', 'chat-launcher');
    launcher.type = 'button';
    launcher.setAttribute('aria-expanded', 'false');
    launcher.setAttribute('aria-controls', 'chat-panel');
    launcher.innerHTML =
      '<img src="' + MASCOT + '" alt="" width="40" height="40">' +
      '<span class="chat-launcher__label">Ask ' + NAME + '</span>';
    launcher.addEventListener('click', toggle);

    panel = el('div', 'chat-panel');
    panel.id = 'chat-panel';
    panel.hidden = true;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Ask ' + NAME + ', the Soapz mascot');

    panel.innerHTML =
      '<div class="chat-head">' +
        '<img class="chat-head__mascot" src="' + MASCOT + '" alt="" width="44" height="44">' +
        '<div>' +
          '<p class="chat-head__name">' + NAME + '</p>' +
          '<p class="chat-head__role">Here to answer your laundry questions</p>' +
        '</div>' +
        '<button type="button" class="chat-close" aria-label="Close the chat">&times;</button>' +
      '</div>' +
      /* role="log" + aria-live so a screen reader announces each new reply
         without the user having to go looking for it. */
      '<div class="chat-log" id="chat-log" role="log" aria-live="polite"></div>' +
      '<div class="chat-suggestions"></div>' +
      '<form class="chat-form">' +
        '<label class="visually-hidden" for="chat-input">Type your question</label>' +
        '<input class="chat-input" id="chat-input" type="text" autocomplete="off"' +
               ' placeholder="Ask a question...">' +
        '<button class="chat-send" type="submit">Send</button>' +
      '</form>';

    document.body.appendChild(launcher);
    document.body.appendChild(panel);

    log = panel.querySelector('.chat-log');
    input = panel.querySelector('.chat-input');
    form = panel.querySelector('.chat-form');

    panel.querySelector('.chat-close').addEventListener('click', toggle);
    form.addEventListener('submit', onSubmit);
    makeDraggable(panel, panel.querySelector('.chat-head'));

    var chips = panel.querySelector('.chat-suggestions');
    SUGGESTIONS.forEach(function (text) {
      var chip = el('button', 'chat-chip', text);
      chip.type = 'button';
      chip.addEventListener('click', function () { send(text); });
      chips.appendChild(chip);
    });

    say('bot', 'Hi, I am ' + NAME + '. Ask me anything about Soapz — hours, prices, parking, or how wash, dry and fold works.');

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && open) toggle();
    });
  }

  function toggle() {
    open = !open;
    launcher.setAttribute('aria-expanded', String(open));
    launcher.classList.toggle('is-open', open);
    clearTimeout(closeTimer);

    if (open) {
      panel.hidden = false;
      /* Force layout so the "closed" state is committed before adding
         is-visible, otherwise the browser collapses straight to open
         with no transition to animate. */
      void panel.offsetWidth;
      panel.classList.add('is-visible');
      input.focus();
    } else {
      panel.classList.remove('is-visible');
      launcher.focus();
      closeTimer = setTimeout(function () { panel.hidden = true; }, CLOSE_DELAY);
    }
  }

  /* ---------- Dragging ----------

     Grabbing the header lets the visitor move the panel anywhere on the
     page. Pointer Events cover mouse, touch and pen with one code path.
     On drag start we pin the panel to explicit left/top pixels (dropping
     the right/bottom/width rules it normally uses, including the mobile
     left+right stretch) so it can be positioned freely, then clamp every
     move to stay fully on screen. */
  function makeDraggable(panelEl, handle) {
    var dragging = false;
    var startX, startY, startLeft, startTop;

    function clamp(left, top) {
      var maxLeft = Math.max(window.innerWidth - panelEl.offsetWidth, 0);
      var maxTop = Math.max(window.innerHeight - panelEl.offsetHeight, 0);
      return {
        left: Math.min(Math.max(left, 0), maxLeft),
        top: Math.min(Math.max(top, 0), maxTop)
      };
    }

    function place(left, top) {
      var pos = clamp(left, top);
      panelEl.style.left = pos.left + 'px';
      panelEl.style.top = pos.top + 'px';
    }

    handle.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.chat-close')) return;
      if (e.button !== undefined && e.button !== 0) return;

      var rect = panelEl.getBoundingClientRect();
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startLeft = rect.left;
      startTop = rect.top;

      panelEl.style.width = rect.width + 'px';
      panelEl.style.left = rect.left + 'px';
      panelEl.style.top = rect.top + 'px';
      panelEl.style.right = 'auto';
      panelEl.style.bottom = 'auto';
      panelEl.classList.add('is-dragging');

      handle.setPointerCapture(e.pointerId);
      e.preventDefault();
    });

    handle.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      place(startLeft + (e.clientX - startX), startTop + (e.clientY - startY));
    });

    function endDrag(e) {
      if (!dragging) return;
      dragging = false;
      panelEl.classList.remove('is-dragging');
      if (handle.hasPointerCapture(e.pointerId)) handle.releasePointerCapture(e.pointerId);
    }
    handle.addEventListener('pointerup', endDrag);
    handle.addEventListener('pointercancel', endDrag);

    /* Keep the panel on screen if the window is resized (or rotated) after
       it has been moved. */
    window.addEventListener('resize', function () {
      if (panelEl.style.left) place(parseFloat(panelEl.style.left), parseFloat(panelEl.style.top));
    });
  }

  function say(who, html) {
    var row = el('div', 'chat-msg chat-msg--' + who);
    if (who === 'bot') {
      row.innerHTML =
        '<img class="chat-msg__mascot" src="' + MASCOT + '" alt="" width="30" height="30">' +
        '<div class="chat-bubble">' + html + '</div>';
    } else {
      row.innerHTML = '<div class="chat-bubble">' + html + '</div>';
    }
    log.appendChild(row);
    log.scrollTop = log.scrollHeight;
    return row;
  }

  function escapeHTML(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function onSubmit(e) {
    e.preventDefault();
    var text = input.value.trim();
    if (text) send(text);
  }

  function send(text) {
    input.value = '';
    say('you', escapeHTML(text));

    /* A short "typing" pause so answers do not appear instantly and feel
       machine-like. It also gives a real API call somewhere to land. */
    var pending = say('bot', '<span class="chat-typing"><i></i><i></i><i></i></span>');

    askSudsy(text).then(function (answer) {
      pending.querySelector('.chat-bubble').innerHTML = answer;
      log.scrollTop = log.scrollHeight;
    });
  }

  /* ---------- The answer source ----------

     THIS IS THE ONE FUNCTION TO REPLACE when the real chatbot goes in. It takes
     the visitor's question and returns a promise for the answer HTML; nothing
     else in this file cares where that answer comes from.

     The replacement must call your own server, not Anthropic directly: an API
     key in a static page is public to anyone who opens the file. So the server
     holds the key, calls the Messages API (POST https://api.anthropic.com/v1/messages,
     model claude-opus-5) with a system prompt describing Soapz and the mascot's
     voice, and returns the text. From here that is simply:

         function askSudsy(question) {
           return fetch('/api/ask-sudsy', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ question: question })
           })
             .then(function (r) { return r.json(); })
             .then(function (data) { return escapeHTML(data.answer); })
             .catch(function () { return FALLBACK; });
         }

     Keep the escapeHTML on anything a model writes — the answers below are
     trusted because we wrote them, a model's are not. */
  function askSudsy(question) {
    return new Promise(function (resolve) {
      setTimeout(function () { resolve(bestAnswer(question)); }, 450);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
