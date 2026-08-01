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

  /* Each entry: keywords to match on, and the answer to give. A keyword can be
     one word or a phrase, and phrases are worth much more than single words —
     see the matching section below for how an entry is scored. Order matters
     only to break a tie, so put the more specific entry first. */
  var ANSWERS = [
    {
      keys: ['coin', 'quarter', 'card', 'credit', 'debit', 'cash', 'pay', 'payment', 'apple pay', 'tap to pay', 'contactless'],
      text: 'You do not need coins. Our machines take coins if you prefer them, but you can also pay by credit or debit card right at the machine. There is a change machine by the front door if you would rather use quarters.'
    },
    {
      keys: ['attendant', 'staff', 'someone', 'somebody', 'anyone', 'anybody', 'a person', 'working there', 'first time', 'how do i use', 'help', 'never been', 'show me'],
      text: 'Yes, an attendant is on site every hour we are open. If you are not sure which machine to use or how much soap to add, just ask. We are happy to walk you through it.'
    },
    {
      keys: ['cost', 'price', 'pricing', 'how much', 'expensive', 'cheap', 'rate', 'dollar', 'charge'],
      text: 'Prices depend on the size of machine you choose, and every price is posted clearly on the machines themselves. The full list is on our <a href="self-service.html">self-service page</a>.'
    },
    {
      keys: ['how long', 'same day', 'turnaround', 'ready', 'pick up', 'pickup', 'how soon', 'next day', 'clothes back', 'laundry back', 'when will it be done'],
      text: 'For wash, dry and fold, most orders dropped off before noon are ready the same day by 6:00pm. Larger orders may take until the next morning, and we will give you a pickup time when you drop off. If you are washing yourself, the dryers finish in about 30 minutes.'
    },
    {
      keys: ['park', 'parking', 'my car', 'accessible', 'wheelchair', 'walker', 'step free', 'handicap'],
      text: 'There is free parking directly in front of the building, including two accessible spaces beside the entrance. The door is step-free and wide enough for a cart or walker.'
    },
    {
      keys: ['hour', 'open', 'close', 'closing', 'what time', 'sunday', 'weekend', 'open late', 'how early', 'still open'],
      text: 'We are open every day from 6:00am to 10:00pm. The last wash goes in at 9:00pm.'
    },
    {
      keys: ['where are you', 'address', 'location', 'located', 'direction', 'map', 'what street', 'how do i get there', 'how do i find', 'your shop', 'your store', 'nearby'],
      text: 'We are at 100 Example Street, Springfield, MO 65804. Our <a href="locations.html">Visit Us page</a> has directions and photos.'
    },
    {
      keys: ['minimum', 'minimum order', 'smallest order', 'per pound', 'how much per pound', 'charge per pound', 'cost per pound', 'how many pound', 'by weight'],
      text: 'There is a $17.50 minimum on wash, dry and fold orders, roughly one full kitchen bag of laundry. Above that it is priced at $1.75 a pound, and we weigh your bag in front of you at the counter.'
    },
    {
      /* No 'wash and fold' phrase here on purpose: 'fold' already catches it,
         and the phrase used to outweigh "how long does wash and fold take",
         which is really a question about turnaround. */
      keys: ['fold', 'drop off', 'dropoff', 'do it for me', 'full service', 'do my laundry for me'],
      text: 'Wash, dry and fold means you leave your bag with us and collect it washed, dried and neatly folded. No sorting, no waiting around. There is more on the <a href="wash-fold.html">wash, dry and fold page</a>.'
    },
    {
      keys: ['comforter', 'bedding', 'blanket', 'duvet', 'bulky', 'king size', 'large load', 'big load', 'sheets'],
      text: 'Our large washers handle bedding and bulky loads like comforters and blankets, so you do not need to split them across machines.'
    },
    {
      keys: ['wifi', 'wi fi', 'internet', 'seating', 'somewhere to sit', 'restroom', 'bathroom', 'toilet', 'folding table', 'while i wait'],
      text: 'We have free Wi-Fi, clean restrooms, comfortable seating, and a folding table at every station, so it is a comfortable place to wait out a cycle.'
    },
    {
      keys: ['soap', 'detergent', 'bleach', 'softener', 'fabric softener', 'sensitive skin', 'scent', 'scented', 'unscented', 'allergy', 'allergic'],
      text: 'You are welcome to bring your own detergent, and we sell it on site if you forget. If you have a scent or skin sensitivity, tell the attendant and we will use what you prefer.'
    },
    {
      keys: ['size', 'capacity', 'small washer', 'washer size', 'how big', 'top load', 'front load', 'which machine', 'what machines'],
      text: 'We have three washer sizes: small (about two loads from home), large (a full hamper or a set of bed sheets), and extra-large (comforters, quilts and heavy blankets). Prices for each are posted on the machine and on our <a href="self-service.html">self-service page</a>.'
    },
    {
      keys: ['dryer', 'dry time', 'drying time', 'dryer cost', 'cost to dry', 'how long to dry', 'how long does drying take', 'minutes to dry', 'how much to dry', 'how much does a dryer cost', 'how much is a dryer'],
      text: 'Dryers cost 25 cents for 6 minutes, and most loads finish drying in 25 to 35 minutes.'
    },
    {
      keys: ['stain', 'red wine', 'grease', 'blood', 'ink', 'oil', 'spot', 'treat a stain', 'get out a stain'],
      text: 'Tell us about a stain or a delicate item when you drop off and we will treat it separately rather than run it through the standard wash. Washing yourself, cold water and treating a stain before it sets both help a lot.'
    },
    {
      keys: ['mixed with', 'my own load', 'own order', 'combined with', 'washed separately', 'with other people', 'someone else laundry'],
      text: 'Your wash, dry and fold order is washed on its own, never mixed with another customer’s laundry.'
    },
    {
      keys: ['busy', 'crowded', 'quietest', 'wait time', 'rush hour', 'how long is the line', 'best time to come'],
      text: 'Mornings before 10:00am and evenings after 8:00pm tend to be the quietest. Call ahead and we can tell you how many machines are free right now.'
    },
    {
      keys: ['change machine', 'change', 'break a bill', 'breaks bills', 'twenty dollar', 'bill changer'],
      text: 'The change machine by the front door breaks bills up to $20.'
    },
    {
      keys: ['membership', 'loyalty', 'account', 'sign up', 'rewards', 'app', 'download'],
      text: 'There is no app to download and no account to set up. Just pay at the machine, or at the counter when you pick up a wash, dry and fold order.'
    },
    {
      keys: ['kid', 'children', 'child', 'baby', 'stroller', 'bring my kid'],
      text: 'You are welcome to bring the kids along. There is seating and room to wait, just keep an eye on them around the machines.'
    },
    {
      keys: ['pet', 'pet bed', 'dog bed', 'pet hair', 'dog blanket', 'cat blanket', 'dog', 'cat'],
      text: 'Pet beds and blankets are fine in our machines. If there is a lot of pet hair, mention it when you drop off so we can give the machine an extra rinse afterward.'
    },
    {
      keys: ['shoe', 'sneaker', 'rug', 'curtain', 'pillow', 'mat'],
      text: 'Rugs, curtains and pillows do fine in our large or extra-large washers. Sneakers and other shoes are best hand-washed, since the drum and hardware are not shoe-safe.'
    },
    {
      keys: ['dry clean', 'dry cleaning', 'dryclean', 'suit', 'wedding dress', 'tie'],
      text: 'We do not offer dry cleaning on site, but call us and we are happy to point you to a dry cleaner nearby.'
    },
    {
      keys: ['wool', 'hand wash', 'sweater', 'silk', 'lace', 'lingerie', 'cashmere', 'bra', 'delicate', 'gentle cycle'],
      text: 'For wool, silk or anything hand-wash-only, use the small washer on a cold, gentle cycle, or ask the attendant about hand-washing it in the sink at the back. Skip the dryer and lay it flat to air dry instead.'
    },
    {
      keys: ['water temperature', 'hot water', 'cold water', 'warm water', 'warm wash', 'what temperature', 'hot or cold', 'which temperature'],
      text: 'Cold water is safe for almost everything and keeps colors from fading. Use warm for towels and bedding, and hot only for whites or anything the care label marks for sanitizing.'
    },
    {
      keys: ['sort', 'separate', 'color', 'colour', 'new jeans', 'bleed', 'dye', 'darks and lights', 'whites and colors'],
      text: 'Sort darks from lights, and wash brand-new dark items like new jeans on their own the first couple of times, since they can bleed dye onto lighter clothes.'
    },
    {
      keys: ['static', 'cling', 'shrink', 'dryer sheet', 'dryer ball', 'wool ball'],
      text: 'A dryer sheet or wool dryer balls cut down on static cling. To avoid shrinking, pull out anything wool, elastic or marked "low heat" while the dryer is still warm rather than fully cycled, or air dry it instead.'
    },
    {
      keys: ['care label', 'care symbol', 'laundry symbol', 'washing symbol', 'the tag mean', 'label mean', 'what does the tag mean'],
      text: 'The little tub icon on a care label is the wash guide: dots inside show temperature, and a hand in the tub means hand-wash only. A triangle means bleach is fine, and a crossed-out triangle means no bleach.'
    },
    {
      keys: ['musty', 'mildew', 'sour smell', 'smells bad', 'smell bad', 'bad smell', 'odor', 'odour', 'stink'],
      text: 'A musty smell usually means a load sat wet too long. Rewash it with an extra rinse, and leaving the washer door cracked between loads at home helps stop it happening again.'
    },
    {
      keys: ['how often', 'wash sheets', 'wash towels', 'how often to wash', 'how many times'],
      text: 'Sheets and towels are typically washed about once a week, and everyday clothes every wear or two. There is no need to overthink it.'
    },
    {
      keys: ['lost', 'missing item', 'left something', 'left behind', 'forgot my', 'lost and found'],
      text: 'If you think you left something behind, call us at <a href="tel:+15550192847">(555) 019-2847</a> with the day and roughly what time you were in, and the attendant will check the lost and found.'
    },
    {
      keys: ['phone number', 'email', 'email address', 'contact you', 'get in touch', 'call you'],
      text: 'You can call us at <a href="tel:+15550192847">(555) 019-2847</a> or email <a href="mailto:hello@soapzlaundry.com">hello@soapzlaundry.com</a>.'
    },
    {
      keys: ['holiday', 'christmas', 'thanksgiving', 'new year', 'closed today', 'open on holidays', 'open on christmas', 'open on thanksgiving', 'open on new year'],
      text: 'We are open every day of the year, 6:00am to 10:00pm, including holidays.'
    },
    {
      keys: ['not ready', 'order delay', 'still not done', 'running late', 'order is late'],
      text: 'If your order is not ready at the time on your ticket, call the number on it and we will tell you exactly where it stands.'
    },
    {
      keys: ['pay when', 'pay first', 'pay at pickup', 'pay before', 'pay up front', 'when do i pay'],
      text: 'For wash, dry and fold you pay when you pick up, by cash or card. For self-service, you pay at the machine before it starts.'
    },
    {
      keys: ['tip', 'tipping', 'gratuity'],
      text: 'Tipping is appreciated but never expected. There is a jar at the counter if you would like to leave one for the attendant.'
    },
    {
      keys: ['eco', 'environment', 'environmentally', 'sustainable', 'high efficiency', 'fragrance free', 'green'],
      text: 'Our machines are high-efficiency and use less water per load than most home washers. We are happy to use a fragrance-free or eco detergent if you ask.'
    },
    {
      keys: ['what bag', 'hamper', 'basket', 'bring my own bag', 'what container', 'how should i bring', 'what should i bring', 'bring my laundry in', 'what do i bring'],
      text: 'Bring your laundry in whatever you have on hand, a hamper, a basket or a bag all work fine. We will hand it back clean, folded and bagged for the walk home.'
    },
    {
      keys: ['business account', 'bulk laundry', 'bulk', 'airbnb', 'gym towels', 'salon', 'commercial'],
      text: 'We take on regular bulk accounts for things like Airbnb linens, gyms and salons. Call and ask for a standing rate.'
    },
    {
      keys: ['claim ticket', 'lost my ticket', 'drop off ticket', 'ticket', 'need an id', 'id required'],
      text: 'You do not need an ID to drop off or pick up, just the ticket we hand you. If you lose it, tell the attendant your name and roughly when you dropped off and they can look it up.'
    },
    {
      keys: ['machine is broken', 'machine broke', 'broken', 'out of order', 'ate my money', 'machine not working', 'jammed', 'stuck', 'refund'],
      text: 'If a machine is not working or keeps your money, flag down the attendant right away. They will refund you or move your load to a working machine at no charge.'
    },
    {
      keys: ['whiten', 'yellowing', 'grey whites', 'dingy', 'brighten', 'dull whites', 'white again'],
      text: 'To brighten dull whites, wash on the hottest setting the care label allows and add a scoop of oxygen-based bleach powder. Skip chlorine bleach on anything elastic, since it breaks the fibers down over time.'
    },
    {
      keys: ['down comforter', 'feather pillow', 'duvet insert', 'goose down', 'down jacket'],
      text: 'A down comforter or pillow does best in our extra-large washer on a gentle cycle, then a long, low-heat dry with a couple of clean tennis balls to keep the down from clumping.'
    },
    {
      keys: ['hello', 'hi', 'hey', 'howdy', 'good morning', 'good evening'],
      text: 'Hello. Ask me anything about the laundromat, or about laundry in general: hours, prices, parking, stain removal, care labels, or how wash, dry and fold works.'
    },
    {
      keys: ['thank', 'cheers', 'appreciate'],
      text: 'Any time. Anything else you would like to know?'
    }
  ];

  var FALLBACK =
    'I am not sure about that one. The attendant will know, so give us a call at ' +
    '<a href="tel:+15550192847">' + PHONE + '</a> and ask.';

  /* ---------- Matching ----------

     This used to be a plain substring search, which was far too loose to be
     useful: "hi" matched inside "which", "rate" inside "temperature", and a
     single common word like "time" outweighed a whole phrase. So the question
     and the keywords are both reduced to stemmed words, a multi-word key has
     to match as consecutive words, and a phrase counts for much more than a
     lone word. Anything that cannot clear MIN_SCORE gets the fallback, which
     is more use to a visitor than a confident wrong answer. */

  var MIN_SCORE = 2;

  /* Too common to say anything about the topic. These still sit in the token
     list so a phrase like "how much" can match; they just never score alone. */
  var STOPWORDS = (
    'a about an and any are as at be been but by can could do does for from ' +
    'had has have how i if in into is it its me my need no not of on or our ' +
    'should so some that the their them there they this to too us was we were ' +
    'what when where which who why will with would you your'
  ).split(' ');

  /* Crude stemmer. Enough to tie "dryers", "drying" and "dried" to one key
     without pulling in a real stemming library for a list this size. */
  function stem(word) {
    if (word.length <= 3) return word;
    if (/ies$/.test(word)) return word.slice(0, -3) + 'y';
    if (/ied$/.test(word)) return word.slice(0, -3) + 'y';
    if (/(ches|shes|sses|xes)$/.test(word)) return word.slice(0, -2);
    if (/ss$/.test(word)) return word;
    if (/s$/.test(word)) return word.slice(0, -1);

    if (/ing$/.test(word) && word.length > 5) word = word.slice(0, -3);
    else if (/ed$/.test(word) && word.length > 4) word = word.slice(0, -2);
    /* So "tipping" lands on "tip" and "dropped" on "drop". */
    if (/([bdfglmnprt])\1$/.test(word)) word = word.slice(0, -1);
    return word;
  }

  function tokenize(text) {
    var raw = text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').split(' ');
    var out = [];
    for (var i = 0; i < raw.length; i++) {
      if (raw[i]) out.push(stem(raw[i]));
    }
    return out;
  }

  /* True when seq turns up in tokens as consecutive words. */
  function hasSequence(tokens, seq) {
    if (seq.length === 1) return tokens.indexOf(seq[0]) !== -1;
    for (var i = 0; i + seq.length <= tokens.length; i++) {
      var hit = true;
      for (var j = 0; j < seq.length; j++) {
        if (tokens[i + j] !== seq[j]) { hit = false; break; }
      }
      if (hit) return true;
    }
    return false;
  }

  /* Compile each keyword once into its stemmed words and what a match earns.
     Keys built only from stopwords are dropped: they would match everything. */
  for (var a = 0; a < ANSWERS.length; a++) {
    var compiled = [];
    for (var c = 0; c < ANSWERS[a].keys.length; c++) {
      var raw = ANSWERS[a].keys[c].toLowerCase().replace(/[^a-z0-9]+/g, ' ').split(' ');
      var seq = tokenize(ANSWERS[a].keys[c]);
      var content = 0;

      for (var w = 0; w < raw.length; w++) {
        if (raw[w] && STOPWORDS.indexOf(raw[w]) === -1) content++;
      }
      if (!seq.length || !content) continue;

      compiled.push({ seq: seq, weight: seq.length === 1 ? 2 : 3 * seq.length });
    }
    ANSWERS[a].compiled = compiled;
  }

  function bestAnswer(question) {
    var tokens = tokenize(question);
    var best = null;
    var bestScore = 0;
    var bestLength = 0;

    for (var i = 0; i < ANSWERS.length; i++) {
      var score = 0;
      var longest = 0;
      var keys = ANSWERS[i].compiled;

      for (var k = 0; k < keys.length; k++) {
        if (hasSequence(tokens, keys[k].seq)) {
          score += keys[k].weight;
          if (keys[k].seq.length > longest) longest = keys[k].seq.length;
        }
      }

      /* Ties go to whichever entry matched on the longer phrase, so a
         specific answer beats a general one that happened to score level. */
      if (score > bestScore || (score === bestScore && score > 0 && longest > bestLength)) {
        bestScore = score;
        bestLength = longest;
        best = ANSWERS[i];
      }
    }

    return bestScore >= MIN_SCORE ? best.text : FALLBACK;
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

    say('bot', 'Hi, I am ' + NAME + '. Ask me anything about Soapz: hours, prices, parking, how wash, dry and fold works, or general laundry questions like stains, care labels and fabric care.');

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
