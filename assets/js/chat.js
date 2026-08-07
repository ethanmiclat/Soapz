/* Ask Soapzy — the mascot chat widget.

   Soapzy is the detergent-bottle character from the brand artwork; his
   portrait is assets/img/mascot-soapzy-avatar.png.

   The whole widget is built here rather than repeated as markup in four HTML
   files, so there is one copy to maintain. It needs JavaScript to work at all,
   so there is nothing lost by building it in JavaScript.

   Answers come from ANSWERS below, one entry per topic, matched on keywords.
   The matching section in the middle of the file explains how an entry is
   scored; the short version is that a keyword alone rarely decides anything,
   because the same word turns up in questions about different things, so the
   rest of the sentence is weighed too. On top of that it forgives typos,
   answers both halves of a two-part question, and reads a follow-up together
   with the question before it.

   tests/chat-matching.test.js runs about 1,950 real phrasings through it,
   including the ones that must NOT be answered. Run it with
   `node tests/chat-matching.test.js` after touching anything here: a new
   keyword can quietly steal questions from a topic three screens away, and
   that test is the only thing that notices.

   See askSoapzy() at the bottom for the single place to swap in a real model. */
(function () {
  'use strict';

  /* The avatar is the official mascot artwork cropped to head and thumb, so
     the face still reads at the 30px the message bubbles use. The full figure
     is in assets/img/mascot-soapzy.png if a bigger one is ever wanted. */
  var MASCOT = 'assets/img/mascot-soapzy-avatar.png';
  var NAME = 'Soapzy';
  var PHONE = '(555) 019-2847';

  /* Each entry is one topic.

       id       a stable name for the topic. Only the tests use it.
       keys     the phrases that trigger the answer. A key can be one word or
                several, and a multi-word key has to appear as consecutive
                words, which makes it worth far more than a lone word.
       context  supporting words that never trigger an answer on their own but
                add to the score of an entry that already matched. This is how
                a word that means different things in different questions gets
                settled: "how much to dry a load" and "can I dry my dog's bed"
                share the word "dry", and the rest of the sentence decides.
       avoid    words that pull an entry down. Used where one topic's keyword
                keeps being borrowed by another topic's question, such as
                "change machine" against "change my pickup time".

     Order matters only to break a tie, so the more specific entry goes first.
     See the matching section below for the exact scoring. */
  var ANSWERS = [
    /* ---------- The store: hours, place, getting there ---------- */
    {
      id: 'hours',
      keys: ['hour', 'hours', 'open', 'close', 'closing', 'latest', 'schedule', 'shut', 'what time', 'before you shut', 'open late', 'open early', 'how early', 'how late', 'still open', 'too late', 'too late to come', 'open right now', 'open now', 'open today', 'open tomorrow', 'open tonight', 'sunday', 'saturday', 'monday', 'weekend', 'weekends only', 'during the week', 'weekday', 'overnight hours', 'twenty four hours', '24 hours', 'all night', 'last wash', 'last load'],
      context: ['time', 'today', 'tonight', 'tomorrow', 'morning', 'evening', 'night', 'am', 'pm', 'until', 'till'],
      avoid: ['comforter', 'stain', 'order', 'ticket', 'christmas', 'thanksgiving', 'holiday', 'easter', 'door', 'locked', 'stuck'],
      text: 'We are open every day from 7:00am to 9:00pm. The last wash goes in at 8:00pm.'
    },
    {
      id: 'holidays',
      keys: ['holiday', 'christmas', 'christmas eve', 'on christmas', 'thanksgiving', 'on thanksgiving', 'new year', 'new years eve', 'easter', 'fourth of july', 'july 4th', 'memorial day', 'labor day', 'closed today', 'open on holidays', 'open on christmas', 'open on thanksgiving', 'open on new year', 'bank holiday'],
      context: ['open', 'close', 'closed', 'shut', 'hour', 'day'],
      text: 'We are open every day of the year, 7:00am to 9:00pm, including holidays.'
    },
    {
      id: 'weather-closure',
      keys: ['snow', 'snowed', 'rain', 'raining', 'storm', 'power', 'blizzard', 'ice storm', 'power outage', 'power cut', 'no power', 'flood', 'tornado', 'closed because of', 'closed due to', 'bad weather', 'emergency closure'],
      context: ['open', 'close', 'today', 'closed', 'still'],
      text: 'We stay open in ordinary bad weather, but a power cut or a serious storm can close us early. Call <a href="tel:+15550192847">' + PHONE + '</a> before you set out and we will tell you if we are open.'
    },
    {
      id: 'location',
      keys: ['where are you', 'where is the laundromat', 'where is the laundrette', 'where is the store', 'where is your shop', 'where you located', 'where are you located', 'address', 'location', 'located', 'direction', 'map', 'google maps', 'what street', 'which street', 'cross street', 'what part of town', 'how do i get there', 'how do i get to you', 'how do i find', 'how close', 'how far', 'far from', 'your shop', 'your store', 'nearby', 'near me', 'zip code', 'postcode', 'what city', 'what town', 'springfield', 'missouri', 'wheres the store', 'wheres your store', 'wheres the laundromat', 'where abouts', 'whereabouts', 'where exactly', 'exactly are you', 'cant find you', 'find you', 'find the store', 'which town'],
      context: ['street', 'road', 'find', 'get', 'drive', 'walk', 'far', 'from'],
      avoid: ['advertise', 'flyer', 'poster', 'sponsor', 'donation'],
      text: 'We are at 100 Example Street, Springfield, MO 65804. Our <a href="locations.html">Visit Us page</a> has directions and photos.'
    },
    {
      id: 'transit',
      keys: ['bus', 'bus stop', 'train', 'subway', 'metro', 'public transport', 'public transit', 'walk there', 'walk from', 'on foot', 'walking distance', 'dont have a car', 'without a car', 'no car', 'bike', 'bicycle', 'bike rack', 'uber', 'lyft', 'taxi', 'cab', 'rideshare'],
      context: ['get', 'there', 'stop', 'route', 'ride', 'park', 'lock'],
      avoid: ['order', 'book'],
      text: 'The bus stops a short walk away and there is a rack out front if you cycle. If you are coming by taxi or rideshare, have them pull into the lot at 100 Example Street, there is room to unload right by the door.'
    },
    {
      id: 'parking',
      keys: ['park', 'parking', 'parking lot', 'car park', 'leave the car', 'leave my car', 'park the car', 'my truck', 'my van', 'where do i park', 'somewhere to park', 'park out front', 'loading zone', 'unload', 'drive up', 'pull up', 'is parking free', 'in the lot', 'in your lot', 'your lot', 'leave a car', 'car overnight', 'room in the lot', 'meter'],
      context: ['car', 'lot', 'front', 'free', 'space', 'outside'],
      avoid: ['stain', 'lit', 'safe', 'night', 'stolen', 'camera'],
      text: 'There is free parking directly in front of the building, and you can pull right up to the door to unload.'
    },
    {
      id: 'accessibility',
      keys: ['accessible', 'accessibility', 'wheelchair', 'walker', 'walking frame', 'mobility', 'disabled', 'disability', 'handicap', 'handicapped', 'step free', 'ramp', 'stairs', 'steps to get in', 'ada', 'bad back', 'any steps', 'steps', 'cannot lift', 'cant lift', 'lift heavy', 'help me carry', 'carry my laundry', 'carry it in', 'too heavy', 'far to walk'],
      context: ['door', 'entrance', 'space', 'in', 'get', 'lift', 'carry', 'heavy'],
      text: 'The door is step-free and wide enough for a wheelchair, walker or cart, and there are two accessible spaces beside the entrance. If a load is too heavy to carry in, the attendant will give you a hand.'
    },
    {
      id: 'carts',
      keys: ['cart', 'trolley', 'trolleys', 'have trolleys', 'any trolleys', 'have carts', 'any carts', 'basket to use', 'borrow a basket', 'borrow a cart', 'laundry cart', 'rolling cart', 'wheeled cart'],
      context: ['use', 'borrow', 'have', 'move', 'push', 'free'],
      text: 'There are rolling carts by the entrance for moving a load from washer to dryer to folding table. They stay in the store, so bring your own basket or bag for the trip home.'
    },
    {
      id: 'climate',
      keys: ['air conditioning', 'air conditioned', 'air con', 'aircon', 'ac', 'is it hot in', 'get hot in', 'hot in there', 'hot in the store', 'warm in there', 'warm inside', 'stuffy', 'boiling', 'roasting', 'heating', 'heated', 'is it cold in', 'cold in there', 'freezing in', 'drafty', 'draughty', 'fan', 'ventilation', 'humid', 'temperature in the store', 'comfortable in the summer'],
      context: ['store', 'inside', 'summer', 'winter', 'wait', 'there', 'sit'],
      avoid: ['water', 'cycle', 'setting', 'dryer', 'wash'],
      text: 'The store is air conditioned through the summer and heated in winter, so it is a comfortable place to wait out a cycle. It does run warm down by the dryers, which is why the seating is at the front.'
    },
    {
      id: 'security',
      keys: ['safe there', 'is it safe there', 'safe at night', 'safe to come', 'is the area safe', 'safe neighborhood', 'safe neighbourhood', 'neighborhood', 'neighbourhood', 'sketchy', 'dodgy', 'rough area', 'bad area', 'well lit', 'lit up', 'is it lit', 'lit at night', 'after dark', 'nervous', 'secure', 'security', 'security camera', 'cameras', 'cctv', 'alarm', 'anyone there at night', 'on my own at night'],
      context: ['night', 'safe', 'late', 'lot', 'store', 'alone', 'evening', 'dark'],
      avoid: ['bleach', 'baby', 'fabric', 'skin', 'cycle', 'leave', 'stuff', 'wash', 'toy', 'immune', 'immunocompromised', 'germ'],
      text: 'An attendant is on site every hour we are open, the floor is covered by cameras and the lot out front is lit after dark, so late evenings are as ordinary here as mornings. Keep your bag and your phone with you rather than on a folding table and you will have no trouble.'
    },
    /* PLACEHOLDER POLICY: whether there is a board or a bin is the
       owner’s call, so this answer points at the phone rather than
       inventing one. */
    {
      id: 'community',
      keys: ['notice board', 'noticeboard', 'bulletin board', 'put up a flyer', 'put a flyer', 'flyer', 'poster', 'advertise in your store', 'advertise in', 'advertise', 'advert', 'sponsor', 'sponsorship', 'fundraiser', 'raffle', 'donate', 'donation', 'donation bin', 'clothes drive', 'clothing drive', 'coat drive', 'shelter', 'food bank', 'charity', 'goodwill', 'give away clothes', 'unwanted clothes', 'textile recycling', 'local school', 'community'],
      context: ['board', 'local', 'clothes', 'give', 'store', 'put'],
      avoid: ['machine', 'washer', 'order'],
      text: 'Notice boards, donation bins and sponsoring things locally are the owner’s call rather than mine. Ring <a href="tel:+15550192847">' + PHONE + '</a> and ask, they are usually glad to help with anything local.'
    },
    {
      id: 'other-locations',
      keys: ['other location', 'another location', 'other store', 'another store', 'other branch', 'second location', 'more locations', 'closer', 'closer to me', 'another laundromat', 'how many locations', 'how many stores', 'other shops', 'other side of town', 'another soapz', 'franchise', 'own a soapz', 'open my own'],
      context: ['location', 'store', 'branch', 'town', 'city', 'side'],
      text: 'This is our only store. It is at 100 Example Street, and the <a href="locations.html">Visit Us page</a> has directions.'
    },
    {
      id: 'about-us',
      keys: ['who owns', 'who runs', 'owner', 'family owned', 'family run', 'locally owned', 'how long have you been', 'how long open', 'when did you open', 'about the business', 'about the owner', 'about you guys', 'your story', 'history', 'closing down', 'shutting down', 'out of business', 'still in business'],
      context: ['business', 'store', 'shop', 'years', 'open'],
      text: 'Soapz is a small independent laundromat run by the family that owns it, with an attendant on site every hour we are open. The <a href="home.html">home page</a> has more about how we work.'
    },

    /* ---------- Paying ---------- */
    {
      id: 'payment',
      keys: ['coin', 'quarter', 'card', 'credit', 'debit', 'cash', 'pay', 'payment', 'apple pay', 'google pay', 'samsung pay', 'tap to pay', 'contactless', 'pay by card', 'pay by cash', 'pay by credit', 'pay for someone else', 'venmo', 'cash app', 'cashapp', 'paypal', 'zelle', 'amex', 'american express', 'visa', 'mastercard', 'bitcoin', 'crypto', 'take cards', 'accept cards', 'take credit', 'accept credit', 'take debit', 'take apple pay', 'need coins', 'need quarters', 'dollar coin', 'laundry card', 'check', 'cheque'],
      context: ['machine', 'washer', 'accept', 'take', 'use', 'need', 'much'],
      avoid: ['gift', 'ticket', 'tip', 'house', 'bank', 'balance'],
      text: 'You do not need coins. Our machines take coins if you prefer them, but you can also pay by credit or debit card right at the machine. There is a change machine by the front door if you would rather use quarters.'
    },
    {
      id: 'when-to-pay',
      keys: ['pay when', 'pay first', 'pay at pickup', 'pay on pickup', 'pay before', 'pay after', 'pay up front', 'pay in advance', 'when do i pay', 'how do i pay', 'do i pay now', 'pay at the counter', 'pay at drop off', 'payment taken', 'am i charged', 'charged', 'settle up', 'deposit'],
      context: ['pickup', 'drop', 'counter', 'before', 'after', 'first'],
      text: 'For wash, dry and fold you pay when you pick up, by cash or card. For self-service, you pay at the machine before it starts.'
    },
    {
      id: 'pricing',
      keys: ['cost', 'price', 'price for', 'cost for', 'cheaper', 'cheaper to', 'pricing', 'how much', 'whats the damage', 'expensive', 'cheap', 'cheapest', 'rate', 'rates', 'dollar', 'charge', 'what do you charge', 'price list', 'how much is it', 'how much does it cost', 'what does it run', 'run me', 'set me back', 'budget', 'afford'],
      context: ['wash', 'washer', 'load', 'machine', 'much', 'total'],
      avoid: ['pound', 'dryer', 'tip', 'water', 'phone', 'bleach', 'outlet', 'plug', 'laptop', 'socket', 'stamp', 'postage', 'club', 'member', 'subscription'],
      text: 'Prices depend on the size of machine you choose, and every price is posted clearly on the machines themselves. The full list is on our <a href="self-service.html">self-service page</a>.'
    },
    {
      id: 'per-pound',
      keys: ['minimum', 'minimum order', 'how do you price', 'priced', 'have a minimum', 'is there a minimum', 'minimum for', 'smallest order', 'per pound', 'a pound', 'per lb', 'how much per pound', 'charge per pound', 'cost per pound', 'how many pound', 'bags of laundry', 'how many bags', 'by weight', 'weigh', 'weighed', 'scale', 'pound of laundry'],
      context: ['pound', 'weight', 'bag', 'order', 'minimum', 'fold'],
      text: 'There is a $17.50 minimum on wash, dry and fold orders, roughly one full kitchen bag of laundry. Above that it is priced at $1.75 a pound, and we weigh your bag in front of you at the counter.'
    },
    {
      id: 'dryer',
      keys: ['dryer', 'dry time', 'drying time', 'dryer cost', 'drying cost', 'per dryer', 'dryer price', 'cost to dry', 'how long to dry', 'take to dry', 'dryers take', 'how long does drying take', 'dry cycle', 'minutes to dry', 'minutes per quarter', 'per quarter', 'how much to dry', 'how much does a dryer cost', 'how much is a dryer', 'how much are the dryers', 'how much for the dryer', 'how much is the dryer', 'how much does it cost to dry', 'dry a load', 'drying included', 'price to dry', 'dryer run', 'tumble dry', 'per dry cycle'],
      context: ['dry', 'minute', 'cycle', 'cost', 'much', 'long', 'quarter', 'cent'],
      avoid: ['clean', 'sheet', 'ball', 'swimsuit', 'bikini', 'wetsuit', 'swim', 'melted', 'cooked', 'burnt', 'burned', 'scorched'],
      text: 'Dryers cost 25 cents for 6 minutes, and most loads finish drying in 25 to 35 minutes.'
    },
    {
      id: 'change-machine',
      keys: ['change', 'change machine', 'break a bill', 'breaks bills', 'break a twenty', 'break a ten', 'twenty dollar', 'bill changer', 'get quarters', 'get coins', 'get change', 'change for a', 'notes', 'bills', 'coin machine'],
      // 'note' also means a message left on a drop-off bag

      context: ['bill', 'quarter', 'coin', 'dollar', 'note', 'machine'],
      avoid: ['order', 'pickup', 'ticket', 'mind', 'time', 'tyre', 'tire', 'car', 'baby'],
      text: 'The change machine by the front door breaks bills up to $20.'
    },
    {
      id: 'atm',
      keys: ['atm', 'cash machine', 'cash point', 'withdraw', 'get cash out'],
      context: ['cash', 'money', 'nearest', 'inside'],
      text: 'We do not have a cash machine in the store. There is a change machine by the door for quarters, and the attendant can point you to the nearest ATM.'
    },
    {
      id: 'refunds',
      keys: ['refund', 'refunded', 'refund policy', 'money back', 'my money back', 'money returned', 'money returned to me', 'two charges', 'double charge', 'charged for two', 'reimburse', 'compensation', 'compensate', 'store credit', 'credit me', 'charged twice', 'double charged', 'charged me twice', 'overcharged', 'charged the wrong', 'wrong amount', 'put in too much', 'paid too much', 'lost money in'],
      context: ['money', 'back', 'refund', 'charge', 'paid', 'wrong'],
      text: 'If a machine takes your money and does not run, the attendant refunds you on the spot, no manager needed. For a card charged twice or a drop-off order billed wrongly, call <a href="tel:+15550192847">' + PHONE + '</a> with the day and rough time and we will put it right.'
    },
    {
      id: 'card-trouble',
      keys: ['card declined', 'card was declined', 'declined', 'card reader is broken', 'card reader broken', 'card reader down', 'reader is not working', 'reader isnt working', 'card wont work', 'card didnt work', 'card not working', 'payment failed', 'wont take my card', 'wouldnt take my card', 'not taking cards', 'card machine', 'playing up', 'chip reader', 'tap did not work', 'tap didnt work'],
      context: ['card', 'machine', 'pay', 'reader', 'work', 'declined'],
      text: 'Try the reader on a different machine first, they run on separate lines and it is usually just the one. If your card is refused all over the store, the change machine by the door will get you quarters, and please tell the attendant so we can have the reader looked at.'
    },
    {
      id: 'tax',
      keys: ['sales tax', 'vat', 'tax included', 'included tax', 'plus tax', 'with tax', 'before tax', 'after tax', 'tax on top', 'tax on', 'pay tax', 'charge tax', 'is tax', 'any tax'],
      context: ['price', 'cost', 'included', 'pay', 'total'],
      avoid: ['w9', 'invoice', 'business', 'ein', 'return'],
      text: 'The price posted on the machine is what you pay. Sales tax is already included, so nothing is added on at the counter.'
    },
    {
      id: 'price-changes',
      keys: ['prices gone up', 'price gone up', 'price increase', 'prices increased', 'put your prices up', 'raised your prices', 'prices changed', 'price change', 'used to cost', 'used to be', 'cheaper last time', 'more than last time', 'costs more than it did', 'why is it more'],
      context: ['price', 'cost', 'up', 'more', 'before', 'last'],
      text: 'Prices do move now and then as water and power costs do, and the figure on the machine is always the current one. If you were charged something different from what was posted, tell the attendant there and then and they will sort it out.'
    },
    /* PLACEHOLDER POLICY: whether an offer is running this week is the
       owner’s call, so this answer points at the phone rather than
       inventing one. */
    {
      id: 'discounts',
      keys: ['discount', 'special', 'any offers', 'student', 'senior', 'student discount', 'senior discount', 'military discount', 'coupon', 'deal', 'promotion', 'special offer', 'loyalty card', 'free dry', 'wash and dry deal'],
      context: ['off', 'cheaper', 'save', 'special', 'week', 'running'],
      text: 'Ask at the counter about any current offers, or call <a href="tel:+15550192847">' + PHONE + '</a>. They will know what is running this week.'
    },
    /* PLACEHOLDER POLICY: gift cards, EBT and what a receipt has to show
       are the owner’s call, so this answer points at the phone rather
       than inventing one. */
    {
      id: 'gift-receipt',
      keys: ['gift card', 'gift certificate', 'gift voucher', 'receipt', 'invoice', 'ebt', 'snap', 'food stamps', 'expense report', 'itemized'],
      context: ['card', 'buy', 'need', 'print', 'email', 'accept'],
      text: 'The counter can sort out receipts and tell you which payment options we take beyond cash and card. Give us a call at <a href="tel:+15550192847">' + PHONE + '</a>.'
    },
    {
      id: 'tipping',
      keys: ['tip', 'tipping', 'gratuity', 'how much to tip', 'do people tip', 'usually tip', 'tip the attendant', 'tip jar', 'rude not to tip'],
      context: ['attendant', 'expected', 'much', 'leave', 'staff'],
      text: 'Tipping is appreciated but never expected. There is a jar at the counter if you would like to leave one for the attendant.'
    },
    {
      id: 'membership',
      keys: ['account', 'sign up', 'signup', 'register', 'do i need an account', 'need an account', 'have to sign up', 'do i have to join', 'have to be a member', 'only for members', 'members only', 'do i need to join', 'app part of', 'part of the club', 'members get the app', 'come with the app', 'the app and the club'],
      context: ['account', 'sign', 'need', 'join', 'member', 'set'],
      avoid: ['business', 'commercial'],
      text: 'No. Walk in, use any machine and pay at it, or leave a bag with us for wash, dry and fold. Nothing is members-only. There are two things you can opt into if you want them: the app on the self-service side, and the Comfort Club for wash, dry and fold.'
    },

    /* ---------- Wash, dry and fold ---------- */
    {
      id: 'wash-fold',
      keys: ['fold', 'folded', 'drop off', 'dropoff', 'drop my laundry', 'drop my clothes', 'drop my', 'do it for me', 'do it all', 'hate doing laundry', 'full service', 'do my laundry', 'do my laundry for me', 'laundry for me', 'wash clothes for me', 'wash for me', 'do my washing', 'my washing', 'wash my stuff', 'washing for me', 'wash my clothes for me', 'you wash it', 'leave it with you', 'leave my laundry with you', 'leave my washing with you', 'leave my clothes with you', 'someone else wash'],
      context: ['service', 'leave', 'you', 'bag', 'counter', 'me'],
      avoid: ['table', 'towel', 'trapped', 'locked', 'stuck', 'stolen', 'taken', 'trolley', 'cart', 'fix', 'repair', 'limescale', 'machine'],
      text: 'Wash, dry and fold means you leave your bag with us and collect it washed, dried and neatly folded. No sorting, no waiting around. There is more on the <a href="wash-fold.html">wash, dry and fold page</a>.'
    },
    /* PLACEHOLDER POLICY: the Comfort Club, our membership for wash, dry and
       fold. The price, what it includes and whether it is a subscription or
       a punch card are the owner's to decide, so these two answers describe
       only what is certain and hand the rest to the counter. Same warning as
       the app above: fill in or delete before going live. See README.md. */
    {
      id: 'comfort-club',
      keys: ['comfort club', 'the club', 'your club', 'membership', 'your membership', 'as a member', 'being a member', 'with the club', 'included in the club', 'join the club', 'club member', 'membership plan', 'member price', 'member rate', 'member discount', 'members get', 'subscription', 'subscribe', 'monthly plan', 'loyalty', 'loyalty program', 'rewards', 'points', 'punch card', 'stamp card', 'worth joining', 'worth it to join'],
      context: ['club', 'member', 'join', 'fold', 'drop', 'month', 'cost'],
      avoid: ['app', 'washer', 'machine'],
      text: 'The Comfort Club is our membership for wash, dry and fold: one payment a month, and every bag after that costs less per pound. The full details are on the <a href="wash-fold.html#comfort-club">wash, dry and fold page</a>, and you can join at the counter or by calling <a href="tel:+15550192847">' + PHONE + '</a>. Drop-off works exactly as it does today without it.'
    },
    {
      id: 'club-manage',
      keys: ['cancel my membership', 'cancel the club', 'cancel my subscription', 'cancel my plan', 'quit the club', 'leave the club', 'pause my membership', 'pause the club', 'freeze my membership', 'change my plan', 'upgrade my plan', 'downgrade', 'stop my membership', 'stop my subscription', 'end my subscription', 'stop paying', 'end my membership', 'refund my membership', 'refund on my membership', 'refund my subscription', 'money back on my membership'],
      context: ['club', 'member', 'cancel', 'pause', 'plan', 'stop'],
      text: 'Call <a href="tel:+15550192847">' + PHONE + '</a> and the attendant will change, pause or cancel a Comfort Club membership for you. Ask them to confirm the date it takes effect, so there is no surprise on the next bill. There is no form to hunt through and nothing to cancel online.'
    },
    {
      id: 'turnaround',
      keys: ['how long', 'how quick', 'how fast', 'how many hours', 'in a day', 'when is it ready', 'when will it be ready', 'wait around', 'same day', 'ready the same day', 'turnaround', 'ready', 'ready today', 'done today', 'done by tonight', 'back tonight', 'order back', 'get it back', 'back today', 'pick up', 'pick it up', 'pickup', 'how soon', 'next day', 'clothes back', 'laundry back', 'when will it be done', 'when do i get it', 'when do i get it back', 'when can i collect', 'takes how long', 'wait for it'],
      context: ['day', 'back', 'ready', 'noon', 'order', 'drop', 'take'],
      avoid: ['cycle', 'dryer', 'urgent', 'asap', 'hurry', 'rush'],
      text: 'For wash, dry and fold, most orders dropped off before noon are ready the same day by 6:00pm. Larger orders may take until the next morning, and we will give you a pickup time when you drop off. If you are washing yourself, the dryers finish in about 30 minutes.'
    },
    {
      id: 'rush',
      keys: ['rush', 'rush order', 'express', 'urgent', 'fast', 'fastest', 'quickly', 'hurry', 'in a hurry', 'before tomorrow', 'by tomorrow', 'turn it around', 'need it back today', 'need this back', 'need this today', 'need this by', 'need it back', 'need it today', 'need it tonight', 'need it fast', 'need it back quick', 'as soon as possible', 'asap', 'same day rush', 'priority'],
      context: ['today', 'tonight', 'fast', 'quick', 'need', 'hour'],
      text: 'Tell the attendant when you drop off and we will do what we can, most morning drop-offs are ready the same evening anyway. If you need something back faster than that, call <a href="tel:+15550192847">' + PHONE + '</a> first and we will tell you honestly whether we can make it.'
    },
    {
      id: 'track-order',
      avoid: ['machine', 'washer', 'beep', 'timer'],
      keys: ['track my order', 'order ready', 'order status', 'status of my order', 'done yet', 'ready yet', 'is it ready', 'check if', 'been done', 'order been done', 'when is my order', 'order done', 'finished', 'drop off finished', 'is my order ready', 'is my laundry ready', 'check on my order', 'check my order', 'where is my order', 'has it been washed'],
      context: ['order', 'ready', 'status', 'yet', 'done'],
      text: 'Call <a href="tel:+15550192847">' + PHONE + '</a> with the number on your ticket and the attendant will tell you exactly where your order stands.'
    },
    {
      id: 'change-order',
      keys: ['cancel my order', 'change my order', 'add to my order', 'change the pickup', 'change my pickup', 'change pickup', 'move my pickup', 'reschedule', 'tomorrow instead', 'pick it up instead', 'someone else pick', 'someone else drop', 'drop it off for me', 'neighbour', 'neighbor', 'on my behalf', 'roommate', 'collect it for me', 'pick it up for me', 'cancel the order', 'collect it later', 'pick it up tomorrow instead', 'someone else pick it up', 'my partner is collecting', 'friend picking up'],
      context: ['order', 'pickup', 'collect', 'instead', 'later', 'else'],
      text: 'Call <a href="tel:+15550192847">' + PHONE + '</a> as soon as you can. If the load has not started we can change it, and picking up later or sending someone else with the ticket is never a problem.'
    },
    {
      id: 'order-late',
      avoid: ['card', 'reader', 'chip', 'washer', 'dryer'],
      keys: ['not ready', 'isnt ready', 'is not ready', 'order late', 'order delay', 'delayed', 'still not done', 'been waiting', 'waiting an hour', 'still waiting', 'waiting on my order', 'running late', 'order is late', 'past the time', 'later than you said'],
      context: ['order', 'ready', 'time', 'ticket', 'wait'],
      text: 'If your order is not ready at the time on your ticket, call the number on it and we will tell you exactly where it stands.'
    },
    {
      id: 'separate-loads',
      keys: ['mixed with', 'mix my', 'other customers', 'other peoples', 'strangers', 'keep my order separate', 'order separate', 'wash it on its own', 'my own load', 'own order', 'combined with', 'washed separately', 'with other people', 'someone else laundry', 'other customers clothes', 'wash it alone', 'by itself'],
      context: ['other', 'customer', 'separate', 'alone', 'own', 'mix'],
      text: 'Your wash, dry and fold order is washed on its own, never mixed with another customer’s laundry.'
    },
    {
      id: 'wash-fold-process',
      keys: ['do you sort', 'do you separate my', 'can i ask', 'ask you to', 'instructions', 'leave instructions', 'soap do you', 'what settings', 'which settings', 'what detergent do you use', 'which detergent do you use', 'what temperature do you wash', 'what settings do you use', 'how do you wash it', 'do you use hot water on', 'can i request', 'special instructions', 'note on the bag', 'put a note', 'write a note', 'note with my', 'use my own detergent for', 'wash everything on', 'wash it all on', 'leave out the softener', 'skip the dryer'],
      context: ['you', 'my', 'sort', 'wash', 'detergent', 'setting', 'request'],
      text: 'We sort darks from lights, wash on the setting that suits the fabric, and dry on medium unless something says otherwise. If you want a particular detergent, temperature or anything left out of the dryer, write it on the ticket or tell the attendant and we will follow it.'
    },
    {
      id: 'packaging',
      keys: ['how does it come back', 'how do i get it back', 'comes back in', 'come back in', 'laundry come back', 'clothes come back', 'my own basket', 'pack it in my own', 'in my own bag', 'bagged', 'in a bag or', 'plastic bag', 'plastic wrap', 'packaged', 'wrapped', 'pair socks', 'paired', 'match socks', 'sock pairs', 'socks together', 'fold the socks', 'sack', 'in a sack', 'fold underwear', 'how is it folded', 'folded how', 'neatly folded', 'creased in the bag'],
      context: ['back', 'bag', 'fold', 'sock', 'order', 'pack'],
      text: 'Your order comes back folded in a clean bag, sorted by type, with socks paired and shirts folded flat. If you would rather have it in your own basket, leave the basket with us at drop-off and we will pack it into that instead.'
    },
    {
      id: 'pockets',
      keys: ['pocket', 'pockets', 'check pockets', 'empty pockets', 'left money in', 'money in my pocket', 'keys in my pocket', 'pen in the pocket', 'biro', 'in a pocket', 'in my pocket', 'pen went through', 'tissue in the wash', 'tissue went through', 'lipstick in the', 'crayon in the wash', 'phone went through the wash', 'wallet in my'],
      context: ['pocket', 'left', 'wash', 'check', 'my', 'through'],
      text: 'We turn out pockets before an order goes in and anything we find is bagged up with your ticket, but have a look yourself first if you can. A pen or a crayon that goes through a hot wash can mark a whole load, and a tissue leaves everything covered in white bits.'
    },
    {
      id: 'ticket-id',
      keys: ['claim ticket', 'lost my ticket', 'drop off ticket', 'ticket', 'give me a ticket', 'get a ticket', 'need an id', 'need id', 'see id', 'show id', 'id required', 'proof of', 'receipt to collect'],
      context: ['ticket', 'collect', 'pickup', 'name', 'id'],
      text: 'You do not need an ID to drop off or pick up, just the ticket we hand you. If you lose it, tell the attendant your name and roughly when you dropped off and they can look it up.'
    },
    {
      id: 'fold-only',
      keys: ['fold only', 'just fold', 'folding only', 'only folding', 'dry only', 'just dry', 'wash only', 'just wash', 'only use the dryer', 'only use a dryer', 'just use the dryer', 'just use a dryer', 'just the washers', 'use just the', 'only want to dry', 'dry at home', 'dry a load here', 'dry clothes i washed at home', 'washed at home', 'already washed'],
      context: ['only', 'just', 'home', 'already', 'service', 'here', 'load', 'myself'],
      text: 'You are welcome to use the dryers on their own for a load you washed at home, and the same goes for washing without drying. Folding on its own is not something we price separately, so ask the attendant and they will sort out what makes sense.'
    },
    {
      id: 'what-to-bring',
      keys: ['what bag', 'what to bring', 'hamper', 'basket', 'need anything', 'bring anything', 'bring my own bag', 'what container', 'how should i bring', 'what should i bring', 'bring my laundry in', 'what do i bring', 'what do i need to bring', 'do i need to bring anything'],
      context: ['bring', 'bag', 'basket', 'need', 'carry'],
      text: 'Bring your laundry in whatever you have on hand, a hamper, a basket or a bag all work fine. We will hand it back clean, folded and bagged for the walk home.'
    },
    {
      id: 'sell-bags',
      keys: ['sell bags', 'buy a bag', 'laundry bag', 'mesh bag', 'delicates bag', 'sell hangers', 'buy hangers'],
      context: ['sell', 'buy', 'bag', 'store', 'have'],
      text: 'The vending wall stocks laundry bags, mesh bags for delicates and a few other bits, so you can pick one up while you are in.'
    },
    {
      id: 'hangers',
      keys: ['hang dry', 'hung dry', 'air dry', 'line dry', 'hanger', 'on hangers', 'hang them up', 'hanging service', 'do you hang', 'drip dry', 'tumble dried', 'dont tumble dry', 'not tumble dried', 'no dryer', 'rather not use a dryer', 'keep it out of the dryer', 'skip the dryer'],
      context: ['hang', 'dry', 'shirt', 'dress', 'flat', 'dont', 'rather', 'instead'],
      text: 'Wash, dry and fold comes back folded rather than hung. If something needs to stay out of the dryer, say so at drop-off and we will air dry it flat instead.'
    },
    {
      id: 'bulk-business',
      keys: ['business account', 'small business', 'businesses', 'bulk laundry', 'bulk', 'for a gym', 'for my gym', 'lots of towels', 'loads of towels', 'airbnb', 'w9', 'tax id', 'ein', 'monthly invoice', 'invoice', 'invoiced', 'billed monthly', 'purchase order', 'net 30', 'accounts payable', 'gym towels', 'salon', 'commercial', 'restaurant linens', 'barber', 'spa', 'hotel', 'office', 'regular account', 'standing order', 'contract'],
      context: ['account', 'weekly', 'regular', 'linen', 'towel', 'business', 'rate'],
      avoid: ['book', 'room', 'stay'],
      text: 'We take on regular bulk accounts for things like Airbnb linens, gyms and salons. Call and ask for a standing rate.'
    },
    /* PLACEHOLDER POLICY: whether there is ever a pickup arrangement is
       the owner’s call, so this answer points at the phone rather than
       inventing one. */
    {
      id: 'delivery',
      avoid: ['pizza', 'food', 'takeaway', 'parcel', 'package', 'mail'],
      keys: ['deliver', 'delivery', 'pickup and delivery', 'collect from me', 'collect from my', 'from my house', 'pick up from', 'pick up from my', 'come get', 'come and get', 'come to my house', 'come to my home', 'door to door', 'drop it at my', 'send a driver'],
      context: ['house', 'home', 'address', 'door', 'driver', 'me'],
      text: 'We are a walk-in laundromat, so laundry is dropped off and collected at the store. If you need another arrangement, call <a href="tel:+15550192847">' + PHONE + '</a> and ask what we can do.'
    },
    {
      id: 'alterations',
      keys: ['alteration', 'alter', 'sew', 'sewing', 'mend', 'mending', 'repair', 'rip', 'rips', 'tear', 'fix rips', 'hem', 'hemming', 'tailor', 'stitch', 'button back on', 'fix a zipper', 'zipper broke', 'zip broke', 'broken zipper', 'patch'],
      context: ['fix', 'torn', 'rip', 'hole', 'button', 'zipper'],
      avoid: ['computer', 'phone', 'car', 'machine', 'washer', 'dryer'],
      text: 'We do not do alterations or repairs on site. Call <a href="tel:+15550192847">' + PHONE + '</a> and the attendant will point you to a tailor nearby.'
    },
    {
      id: 'dry-clean',
      keys: ['dry clean', 'dry cleaning', 'dryclean', 'dry cleaner', 'suit', 'blazer', 'dry clean only', 'label says dry clean'],
      context: ['clean', 'only', 'label', 'suit', 'press'],
      avoid: ['dog', 'cat', 'pet'],
      text: 'We do not offer dry cleaning on site, but call us and we are happy to point you to a dry cleaner nearby.'
    },

    /* ---------- Using the machines ---------- */
    {
      id: 'machine-sizes',
      avoid: ['pillow', 'curtain', 'teddy', 'toy', 'duvet'],
      keys: ['size', 'capacity', 'small washer', 'washer size', 'how big', 'big machine', 'big washer', 'biggest machine', 'large machine', 'largest machine', 'extra large', 'how large', 'big enough', 'biggest thing', 'how big a load', 'top load', 'top loader', 'front load', 'front loader', 'biggest washer', 'largest washer', 'biggest dryer', 'which machine', 'what machines', 'which washer', 'what size washer', 'machine should i use'],
      context: ['machine', 'washer', 'load', 'big', 'size', 'fit'],
      text: 'We have three washer sizes: small (about two loads from home), large (a full hamper or a set of bed sheets), and extra-large (comforters, quilts and heavy blankets). Prices for each are posted on the machine and on our <a href="self-service.html">self-service page</a>.'
    },
    {
      id: 'machine-brand',
      keys: ['what brand', 'which brand', 'what make', 'make of machine', 'brand of machine', 'speed queen', 'maytag', 'whirlpool', 'dexter', 'huebsch', 'how old are the machines', 'how old are your machines', 'when were the machines', 'machines put in', 'what washers do you', 'what machines do you', 'what do you run', 'new machines', 'commercial machine', 'commercial washers', 'who services', 'service the machines', 'serviced', 'sell used machines', 'sell your old machines', 'buy a machine from you'],
      context: ['machine', 'washer', 'dryer', 'brand', 'make', 'old'],
      text: 'They are commercial front-load washers and dryers, the sort built to run all day, and they are serviced on a schedule rather than only when something breaks. If you are shopping for a machine of your own, ask the attendant, they will happily tell you what we run and how it has held up.'
    },
    /* PLACEHOLDER POLICY: the app for the self-service side. What it is
       called, where it is downloaded and whether it can reserve a machine
       are not settled, so these two answers cover the shape of it and send
       the specifics to the phone. Fill them in or delete them before the
       site goes live: an answer that promises an app nobody can download is
       worse than no answer. See README.md. */
    {
      id: 'app',
      keys: ['app', 'the app', 'in the app', 'on the app', 'app tell me', 'your app', 'an app', 'mobile app', 'phone app', 'download the app', 'download', 'app store', 'google play', 'play store', 'ios', 'android', 'iphone app', 'speed queen app', 'start a machine from my phone', 'start it from my phone', 'from my phone', 'check machines from home', 'see which machines are free from home', 'see if a washer is free', 'washer is free before', 'check before i drive', 'before i drive over', 'smartphone', 'no smartphone', 'without a smartphone', 'not good with phones', 'machines online', 'check online', 'remote start', 'do i need the app'],
      context: ['app', 'phone', 'download', 'machine', 'washer', 'free', 'start', 'tell', 'done', 'load'],
      avoid: ['fold', 'club', 'membership', 'order', 'ticket', 'crash', 'crashed', 'broken', 'stuck', 'password', 'error', 'frozen', 'charged', 'logged'],
      text: 'The app is for the self-service side. It saves you a wasted trip by showing which machines are already in use before you set out, and it starts the machine you have loaded from your phone. It does not change what a wash costs, that is the <a href="wash-fold.html#comfort-club">Comfort Club</a> and that one is for drop-off. There is more on the <a href="self-service.html#app">self-service page</a>, and every machine still works without it.'
    },
    {
      id: 'app-trouble',
      keys: ['app not working', 'app is not working', 'app isnt working', 'app is broken', 'app crashed', 'app has crashed', 'app wont load', 'app is stuck', 'cant log in', 'cannot log in', 'wont let me log in', 'forgot my password', 'reset my password', 'app says', 'says a machine is free', 'app says a machine', 'app said', 'app shows', 'app wont start', 'app charged me', 'charged in the app', 'charged by the app', 'app took my money', 'logged me out', 'log me out', 'wont let me pay', 'app wont let me', 'app shows all', 'shows all machines'],
      context: ['app', 'phone', 'machine', 'log', 'password', 'start'],
      text: 'Close the app and open it again first, which clears most of it. If it still will not start a machine, or it shows one free that somebody is already using, tell the attendant: they will start the machine for you or move you to another one, so the app going wrong never costs you a wash. For a login problem or a charge you do not recognise, call <a href="tel:+15550192847">' + PHONE + '</a>.'
    },
    {
      id: 'self-service',
      alone: true,
      avoid: ['fix', 'repair', 'limescale', 'mould', 'mold', 'buy'],
      keys: ['self service', 'self serve', 'do it myself', 'wash it myself', 'machine at home broke', 'washer at home broke', 'no machine at home', 'no washer at home', 'no washing machine', 'dont have a washer', 'dont have a machine', 'dont have a washing machine', 'my machine broke', 'my washer broke', 'coin laundry', 'coin op', 'difference between', 'what services', 'what do you offer', 'what do you do here', 'both services'],
      context: ['service', 'myself', 'own', 'drop', 'fold', 'difference'],
      text: 'Both. You can use the machines yourself and pay at the machine, which is our <a href="self-service.html">self-service</a> side, or leave a bag with us and collect it washed, dried and folded, which is <a href="wash-fold.html">wash, dry and fold</a>. Most people do one or the other depending on the week.'
    },
    {
      id: 'still-wet',
      avoid: ['floor', 'leak', 'puddle'],
      keys: ['still wet', 'still damp', 'came out wet', 'came out damp', 'not drying', 'isnt drying', 'no heat', 'not getting hot', 'soaked', 'took ages to dry'],
      context: ['dryer', 'dry', 'wet', 'damp', 'load', 'heat'],
      text: 'A load that comes out damp is nearly always an overfilled dryer or a full lint trap. Split it across two dryers, empty the trap and give it another cycle. If the drum is turning with no heat at all, tell the attendant, that one is on us to fix.'
    },
    {
      id: 'machine-howto',
      keys: ['how do i start', 'how do i use', 'how to use', 'how do i use the machine', 'how do i work', 'how to work', 'work the washer', 'work these machines', 'get the washer going', 'pour the detergent', 'which slot', 'what slot', 'how do you work', 'how does it work', 'how does the washer work', 'how does the machine work', 'where does the soap go', 'where do i put the detergent', 'which dispenser', 'which drawer', 'what drawer', 'dispenser drawer', 'what button', 'press start', 'start the washer', 'start the machine', 'select a cycle', 'instructions'],
      context: ['machine', 'washer', 'start', 'button', 'cycle', 'put', 'work'],
      text: 'Load the drum, add detergent to the dispenser drawer at the top left (softener goes in the middle slot), choose your cycle and temperature, then pay and press start. The steps are printed on every machine, and the attendant will happily walk you through your first one.'
    },
    {
      id: 'cycle-options',
      keys: ['permanent press', 'perm press', 'normal cycle', 'heavy duty', 'heavy cycle', 'bulky cycle', 'sanitize cycle', 'sanitise cycle', 'delicate cycle', 'which cycle', 'what cycle', 'cycle options', 'what do the cycles mean', 'difference between the cycles', 'cycles mean', 'prewash', 'pre wash', 'extra rinse', 'second rinse', 'rinse only', 'rinse and spin', 'spin only', 'drain and spin', 'spin speed', 'high spin', 'low spin', 'no spin', 'soak option'],
      context: ['cycle', 'option', 'setting', 'button', 'wash', 'use'],
      avoid: ['long', 'minute', 'time', 'price'],
      text: 'Normal suits most loads. Heavy duty runs longer for work clothes and towels, permanent press finishes with a cool rinse so shirts crease less, delicate is a short slow wash, and sanitize runs hotter for bedding and anything that has been through illness. An extra rinse is worth it for towels, bedding and anyone with sensitive skin.'
    },
    {
      id: 'trip-time',
      keys: ['whole trip', 'the whole thing', 'start to finish', 'how much time should i', 'how long will i be there', 'how long does the whole', 'time should i budget', 'budget for', 'set aside', 'plan for', 'how long am i there for', 'in and out'],
      context: ['time', 'long', 'wash', 'dry', 'wait', 'there'],
      text: 'Plan on about an hour and a half from walking in to walking out: half an hour to wash, another thirty to thirty five minutes to dry, and a few minutes at the folding table. Come before 10:00am or after 7:00pm and you will not wait for a machine.'
    },
    {
      id: 'cycle-done',
      keys: ['how do i know when its done', 'know when its finished', 'know when it finishes', 'when its finished', 'when it has finished', 'when my load is done', 'load is done', 'know when my', 'tell me when', 'machine tell me', 'does it beep', 'beep', 'beeps', 'buzzer', 'alarm when', 'timer', 'time remaining', 'time left', 'minutes left', 'how long left', 'countdown', 'display'],
      context: ['done', 'finish', 'machine', 'know', 'time', 'left'],
      avoid: ['order', 'ticket', 'fold', 'ready today', 'app'],
      text: 'Every machine has a display counting down the minutes left, and it beeps a few times when it finishes. If you have stepped away, the attendant will keep an eye on it for you if you ask before you go.'
    },
    {
      id: 'wash-cycle-time',
      keys: ['wash cycle', 'cycle take', 'how many minutes', 'minutes is a wash', 'length', 'how long is a wash', 'how long does a wash take', 'how long does the washer', 'wash time', 'minutes a wash', 'cycle length', 'how long per load', 'how long does one load'],
      context: ['cycle', 'wash', 'minute', 'long', 'machine'],
      text: 'A normal wash cycle runs about 30 minutes, a heavy or sanitize cycle a little longer. With drying, plan on around an hour for a full load start to finish.'
    },
    {
      id: 'overloading',
      keys: ['overload', 'overloading', 'how full', 'too full', 'how much fits', 'how many clothes fit', 'stuff it full', 'stuff the washer', 'stuff the machine', 'cram', 'how much should i put', 'fill it to the top', 'fill it', 'pack it in', 'fill the washer', 'how many loads'],
      context: ['full', 'fit', 'load', 'machine', 'drum', 'much'],
      text: 'Fill the drum about three quarters full and leave a hand-width at the top. An overloaded washer cannot move the clothes around, so they come out still dirty and take far longer to dry.'
    },
    {
      id: 'how-many-machines',
      keys: ['how many machines', 'number of machines', 'how many washers', 'how many dryers', 'how many washing machines', 'many washing machines', 'enough machines', 'enough washers', 'machines free', 'washer free', 'dryer free', 'machine free', 'free washer', 'free dryer', 'free machine', 'washer is free', 'dryer is free', 'machines available', 'loads at once', 'multiple loads', 'several loads', 'more than one machine', 'two machines at once', 'anything free', 'any machines open', 'available right now', 'is there a machine free'],
      context: ['machine', 'washer', 'dryer', 'free', 'available', 'now'],
      text: 'We have banks of small, large and extra-large washers, with dryers along the back wall. Call us before you set out and we will tell you how many are free right now.'
    },
    {
      id: 'busy',
      keys: ['busy', 'busiest', 'least busy', 'crowded', 'packed', 'quiet', 'quietest', 'wait time', 'rush hour', 'how long is the line', 'how long is the wait', 'the wait', 'wait for a machine', 'is there a queue', 'best time', 'best time to come', 'when should i come', 'avoid the crowd'],
      context: ['time', 'come', 'day', 'morning', 'evening', 'wait', 'saturday', 'sunday', 'weekend'],
      text: 'Mornings before 10:00am and evenings after 7:00pm tend to be the quietest. Call ahead and we can tell you how many machines are free right now.'
    },
    {
      id: 'broken-machine',
      keys: ['machine is broken', 'machine broke', 'machine breaks', 'breaks down', 'broken', 'out of order', 'ate my money', 'ate', 'ate two', 'got eaten', 'eaten my money', 'taken my money', 'taken my coins', 'took my money', 'took my quarters', 'took my coins', 'swallowed', 'machine not working', 'not working', 'isnt working', 'wont work', 'doesnt work', 'stopped working', 'jammed', 'stopped mid', 'mid cycle', 'noise', 'noisy', 'banging', 'grinding', 'shaking', 'smells like burning', 'burning smell', 'smell of burning', 'did not start', 'didnt start', 'wont start', 'not draining', 'not spinning', 'not filling', 'wont fill', 'will not fill', 'no water', 'not heating up', 'hanging off', 'falling off', 'door is broken', 'handle broke'],
      context: ['machine', 'washer', 'dryer', 'money', 'refund', 'work'],
      text: 'If a machine is not working or keeps your money, flag down the attendant right away. They will refund you or move your load to a working machine at no charge.'
    },
    {
      id: 'door-stuck',
      keys: ['door wont open', 'door will not open', 'wont open', 'door is locked', 'door locked', 'cant open the door', 'cannot open the door', 'cant get it open', 'cannot get it open', 'get the washer open', 'get the door open', 'clothes are locked in', 'locked in the machine', 'is trapped', 'washing is trapped', 'trapped', 'trapped in the machine', 'stuck', 'stuck in the machine', 'how do i stop the machine', 'stop the machine', 'stop it early', 'stop it', 'stop the wash', 'cancel the cycle', 'cancel the wash', 'pause the machine', 'pause it', 'pause the wash', 'open it mid cycle', 'add clothes after it started', 'add something after', 'add a shirt', 'forgot to add'],
      context: ['door', 'machine', 'open', 'stop', 'cycle', 'lock', 'clothes', 'washing'],
      text: 'A front loader keeps the door locked while there is water in the drum, and it releases a minute or two after the cycle ends. To get in sooner, press stop and wait for it to drain rather than pulling on the handle. If it is still shut after that, the attendant has a key that opens it.'
    },
    {
      id: 'wrong-machine',
      keys: ['wrong machine', 'wrong washer', 'wrong dryer', 'started the wrong', 'paid for the wrong', 'put my clothes in the wrong', 'loaded the wrong', 'used the wrong one', 'by mistake', 'machine next to', 'someone elses machine', 'wrong number machine', 'paid on the wrong'],
      context: ['wrong', 'machine', 'paid', 'started', 'clothes'],
      text: 'Tell the attendant and they will sort it out, whether that means starting the machine your clothes are actually in or putting the money back. It happens most days, so nobody will mind.'
    },
    {
      id: 'spill-leak',
      keys: ['water on the floor', 'on the floor', 'the floor', 'floor is soaked', 'all over the floor', 'water everywhere', 'wet floor', 'puddle', 'flooded', 'flooding', 'leaking', 'leak', 'leaked', 'water dripping', 'spilled detergent', 'spilt', 'dropped my detergent', 'slipped', 'slippery', 'made a mess'],
      context: ['floor', 'water', 'machine', 'mess', 'wet'],
      avoid: ['stain', 'shirt', 'clothes', 'wine', 'coffee', 'wax', 'candle', 'gum'],
      text: 'Tell the attendant rather than mopping it yourself, they have the sign and the mop and they would rather nobody slipped. If a machine is the one leaking they will take it out of service on the spot, and nothing you spill is going to be the worst thing that happened this week.'
    },
    {
      id: 'heat-damage',
      keys: ['melted', 'melt', 'burned', 'burnt', 'cooked', 'baked', 'print', 'scorched', 'ruined in the dryer', 'dryer ruined', 'too hot for', 'print peeled', 'print cracked', 'peeled off', 'peeling', 'iron on peeled', 'logo cracked', 'logo peeled', 'elastic went', 'came out stiff'],
      context: ['dryer', 'heat', 'hot', 'dry', 'clothes', 'ruin'],
      text: 'Synthetics, sportswear and anything with a printed logo need the low heat setting, and a hot dryer is what melts prints and kills elastic. Pull those out while they are still slightly damp. If a dryer here ran hot enough to damage a load, tell the attendant, that is ours to put right.'
    },
    {
      id: 'time-limit',
      keys: ['time limit', 'how long can i leave', 'how long do i have', 'before you close', 'leave my basket', 'forget my clothes', 'forget my laundry', 'fee', 'late fee', 'pop out', 'step out', 'nip out', 'come back before', 'overnight', 'clothes in overnight', 'leave it overnight', 'leave my clothes overnight', 'come back later', 'late collecting', 'late picking it up', 'if i am late', 'keep it for me', 'hold it for me', 'leave and come back', 'abandoned', 'left too long', 'forgot my clothes in the machine'],
      context: ['leave', 'long', 'back', 'machine', 'overnight'],
      text: 'There is no meter running, but please come back before the cycle ends so the machine frees up. Anything left after closing is bagged and kept behind the counter, so call us and we will hold it for you.'
    },
    {
      id: 'unattended',
      keys: ['unattended', 'have to stay', 'stay while', 'stay with it', 'leave my laundry', 'leave my washing', 'leave my clothes', 'watch my clothes', 'watch my stuff', 'have to be there', 'be there while', 'need to be there', 'safe to leave', 'is my stuff safe', 'my stuff safe', 'my things safe', 'go home while', 'leave it running', 'come back for it'],
      context: ['leave', 'alone', 'stay', 'watch', 'running', 'while'],
      avoid: ['baby', 'detergent', 'bleach'],
      text: 'An attendant is on site every hour we are open, so the store is never empty. Even so, it is best to stay with your laundry, or at least come back before the cycle ends.'
    },
    {
      id: 'etiquette',
      keys: ['took my clothes out of', 'took my clothes out', 'someone moved my', 'saving a machine', 'is it rude', 'basket on the machine', 'etiquette', 'rules of the', 'in use', 'machine is free', 'someone left their', 'left their clothes', 'machines are taken', 'all the machines', 'take someones'],
      context: ['someone', 'machine', 'my', 'clothes', 'out', 'else'],
      avoid: ['tip'],
      text: 'If someone has moved your laundry or you are unsure whether a machine is free, ask the attendant rather than sorting it out yourself. They keep an eye on which machines are running and will step in.'
    },

    /* ---------- What we can wash ---------- */
    {
      id: 'oil-flammable',
      keys: ['motor oil', 'engine oil', 'oily rag', 'oily rags', 'shop rag', 'shop rags', 'work rags', 'gasoline', 'petrol', 'diesel', 'kerosene', 'lighter fluid', 'paint thinner', 'turpentine', 'white spirit', 'solvent', 'flammable', 'soaked in oil', 'covered in oil', 'soaked in petrol', 'oil change'],
      context: ['rag', 'wash', 'clothes', 'dryer', 'work', 'soaked', 'shop', 'garage'],
      avoid: ['olive', 'cooking', 'butter', 'salad', 'sauce', 'food'],
      text: 'Anything soaked in petrol, motor oil, paint thinner or another solvent cannot go in our machines, and please never put it in a dryer anywhere: the fumes stay in the fabric and the heat can set it alight. A light grease mark on ordinary work clothes is fine, rub in a little dish soap first and wash it warm.'
    },
    {
      id: 'soiled-items',
      keys: ['vomit', 'sick on', 'threw up on', 'urine', 'pee on', 'wee', 'poop', 'poo', 'soiled', 'soiling', 'had an accident', 'potty training', 'bed wetting', 'bedwetting', 'wet the bed', 'wet his bed', 'wet her bed', 'incontinence', 'blood on', 'period stain', 'bodily fluid', 'human waste'],
      context: ['wash', 'clean', 'sheet', 'bedding', 'stain', 'out', 'hot'],
      text: 'Rinse or scrape the worst off at home and bag it for the trip, then wash it hot with the sanitize option. Blood is the exception, cold water first, because hot water sets it. We do take soiled bedding on drop-off as long as it has been rinsed, just say so at the counter.'
    },
    {
      id: 'pillows',
      keys: ['pillow', 'pillows', 'pillows go', 'pillows in the', 'cushion', 'cushions', 'cushion cover', 'throw pillow', 'memory foam', 'body pillow', 'wash my pillows'],
      context: ['wash', 'washer', 'machine', 'dry', 'clean', 'bed', 'big'],
      avoid: ['case', 'pillowcase', 'stuffed', 'teddy'],
      text: 'Wash pillows two at a time so the drum stays balanced, on a gentle warm cycle with an extra rinse. Dry them on low with a couple of clean tennis balls and give them longer than you think, a damp pillow goes musty from the inside. Memory foam is the exception, that one only ever gets spot cleaned and air dried.'
    },
    {
      id: 'curtains',
      keys: ['curtain', 'curtains', 'drape', 'drapes', 'net curtain', 'shower curtain', 'blackout curtain', 'valance', 'blinds'],
      context: ['wash', 'clean', 'machine', 'hang', 'dry'],
      text: 'Cotton and polyester curtains wash cold on gentle and go straight back on the rail damp, which drops most of the creases out. Shower curtains do well washed with a couple of towels. Anything heavy, lined or velvet is a dry cleaning job, and we can point you to one nearby.'
    },
    {
      id: 'stuffed-toys',
      keys: ['stuffed animal', 'stuffed animals', 'stuffed toy', 'teddy', 'teddy bear', 'plush', 'plushie', 'soft toy', 'cuddly toy', 'dolls clothes', 'my kids toys', 'wash toys'],
      context: ['wash', 'clean', 'machine', 'dry', 'kid', 'child'],
      text: 'Put soft toys in a pillowcase or mesh bag, knot the top, and run them cold on gentle. Air dry them rather than tumbling, and check first for a battery box or glued-on eyes, since neither survives a wash.'
    },
    {
      id: 'car-seat',
      keys: ['car seat', 'carseat', 'car seat cover', 'booster seat', 'stroller cover', 'pram cover', 'buggy cover', 'pushchair', 'pushchair cover', 'buggy', 'high chair cover', 'seat covers', 'car seat straps'],
      context: ['wash', 'clean', 'cover', 'baby', 'machine'],
      text: 'Take the fabric cover off the frame and wash it cold on gentle, then air dry it flat. Never bleach or hot wash a car seat cover or its straps, it weakens the webbing that has to hold in a crash. Sponge the straps with warm soapy water instead.'
    },
    {
      id: 'formalwear',
      keys: ['wedding dress', 'bridal', 'bridesmaid', 'bridesmaid dress', 'prom dress', 'ball gown', 'evening gown', 'gown', 'tuxedo', 'formal dress', 'graduation gown', 'costume', 'halloween costume', 'cosplay', 'dance costume', 'sequin', 'beaded'],
      context: ['wash', 'clean', 'dress', 'wear', 'delicate'],
      text: 'Anything formal with structure, beading or lining is a dry cleaning job, and we do not dry clean on site, so call us and we will point you to one nearby. A simple costume with no glued trim can go in the small washer cold, inside a mesh bag, and air dry.'
    },
    {
      id: 'hats',
      keys: ['hat', 'hats', 'cap', 'caps', 'baseball cap', 'ball cap', 'beanie', 'snapback', 'visor', 'sun hat'],
      context: ['wash', 'clean', 'shape', 'dry', 'machine'],
      text: 'A washer will crush the brim out of shape, so caps do best hand washed in warm water with a drop of detergent, then dried over something round like a jar. Knitted beanies wash cold on gentle and should be laid flat to dry, never tumbled.'
    },
    {
      id: 'swimwear',
      keys: ['swimsuit', 'swim suit', 'bathing suit', 'bikini', 'swim trunks', 'swim shorts', 'swimwear', 'wetsuit', 'rash guard', 'chlorine', 'pool smell', 'salt water'],
      context: ['wash', 'clean', 'dry', 'smell', 'pool'],
      text: 'Rinse swimwear in cold water the same day, then wash it cold on gentle with no softener. Keep it out of the dryer altogether, heat is what kills the stretch, so roll it in a towel and lay it flat.'
    },
    {
      id: 'table-linens',
      keys: ['tablecloth', 'table cloth', 'table linen', 'napkin', 'napkins', 'placemat', 'place mat', 'tea towel', 'dish towel', 'dish cloth', 'apron', 'oven mitt', 'runner'],
      context: ['wash', 'clean', 'stain', 'hot', 'iron'],
      avoid: ['wax', 'candle', 'gum', 'crayon'],
      text: 'Treat food and wine marks before they set, then wash table linen on the hottest setting the label allows. Take it out of the dryer slightly damp and it will hang or fold almost crease free.'
    },
    {
      id: 'reusable-bags',
      keys: ['reusable bag', 'reusable bags', 'grocery bag', 'shopping bag', 'tote bag', 'tote', 'canvas bag', 'canvas', 'lunch bag', 'cooler bag', 'insulated bag'],
      context: ['wash', 'clean', 'machine', 'dry'],
      text: 'Cloth shopping bags go in cold, inside out, and air dry over a chair. Insulated or lined bags should only be wiped out with hot soapy water, since the lining comes apart in a machine.'
    },
    {
      id: 'heirloom',
      keys: ['antique', 'vintage', 'heirloom', 'handmade quilt', 'grandmothers', 'my grandmother made', 'old linen', 'old lace', 'christening gown', 'family quilt', 'delicate old'],
      context: ['wash', 'clean', 'careful', 'old', 'damage'],
      text: 'Old fabric rarely survives a spin cycle. Soak it in cool water in a basin with a gentle detergent, press the water out rather than wringing, then dry it flat on a towel out of the sun. If it is valuable to you, a specialist cleaner is worth the money and we can point you at one.'
    },
    {
      id: 'bedding',
      keys: ['comforter', 'bedding', 'blanket', 'duvet', 'quilt', 'bulky', 'king size', 'large load', 'big load', 'sheets', 'bed sheets', 'mattress pad', 'mattress cover', 'mattress protector'],
      context: ['wash', 'machine', 'big', 'large', 'fit', 'bed'],
      text: 'Our large washers handle bedding and bulky loads like comforters and blankets, so you do not need to split them across machines.'
    },
    {
      id: 'down',
      keys: ['down comforter', 'winter coat', 'down filled', 'filled comforter', 'down duvet', 'feather pillow', 'duvet insert', 'goose down', 'down jacket', 'down coat', 'ski jacket', 'snow jacket', 'puffer', 'feathers clumping'],
      context: ['down', 'feather', 'dry', 'clump', 'gentle'],
      text: 'A down comforter or pillow does best in our extra-large washer on a gentle cycle, then a long, low-heat dry with a couple of clean tennis balls to keep the down from clumping.'
    },
    {
      id: 'shoes-rugs',
      keys: ['shoe', 'shoes', 'sneaker', 'trainers', 'boots', 'slippers', 'rug', 'mat', 'bath mat', 'doormat', 'door mat', 'floor mat', 'mop', 'mop head'],
      context: ['wash', 'machine', 'clean', 'safe'],
      avoid: ['down', 'feather'],
      text: 'Rugs, curtains and pillows do fine in our large or extra-large washers. Sneakers and other shoes are best hand-washed, since the drum and hardware are not shoe-safe.'
    },
    {
      id: 'backpack-gear',
      keys: ['backpack', 'rucksack', 'sleeping bag', 'tent', 'camping gear', 'gym bag', 'duffel', 'kit bag'],
      context: ['wash', 'machine', 'clean', 'safe', 'dry'],
      text: 'Backpacks, sleeping bags and cover fabrics all wash fine on a gentle cold cycle, zips closed and straps tucked in. Air dry them rather than tumbling, since the heat can melt the coatings and buckles.'
    },
    {
      id: 'uniforms',
      keys: ['uniform', 'work clothes', 'scrubs', 'coveralls', 'overalls', 'workwear', 'hi vis', 'chef whites'],
      context: ['work', 'dirty', 'wash', 'separate', 'shift'],
      avoid: ['motor', 'engine', 'gasoline', 'petrol', 'solvent', 'rag'],
      text: 'Uniforms, scrubs and work clothes are all fine here. If they are heavily soiled or greasy, say so when you drop off and we will wash them separately on a hotter cycle.'
    },
    {
      id: 'diapers',
      keys: ['diaper', 'cloth diaper', 'nappy', 'nappies', 'reusable diaper'],
      context: ['wash', 'hot', 'rinse', 'baby'],
      text: 'Cloth diapers wash best on a hot cycle with an extra rinse and no fabric softener, since softener stops them absorbing. Give them a cold rinse at home first if you can.'
    },
    {
      id: 'baby-clothes',
      keys: ['baby clothes', 'newborn', 'infant clothes', 'baby detergent', 'baby safe', 'safe for a baby', 'safe for baby', 'for a baby', 'onesies', 'burp cloth', 'baby blanket'],
      context: ['baby', 'wash', 'detergent', 'gentle', 'skin'],
      text: 'Baby clothes wash fine on a normal warm cycle. Use a fragrance-free detergent and skip the softener, since new skin reacts to both, and give anything new a wash before it is worn.'
    },
    {
      id: 'delicates',
      keys: ['wool', 'woolen', 'woollen', 'hand wash', 'hand wash only', 'sink', 'sweater', 'jumper', 'silk', 'lace', 'lingerie', 'cashmere', 'bra', 'delicate', 'gentle cycle', 'wool in the dryer', 'sweater in the dryer', 'knitwear'],
      context: ['gentle', 'cold', 'wash', 'dryer', 'flat'],
      avoid: ['pill', 'bobble', 'lint'],
      text: 'For wool, silk or anything hand-wash-only, use the small washer on a cold, gentle cycle, or ask the attendant about hand-washing it in the sink at the back. Skip the dryer and lay it flat to air dry instead.'
    },
    {
      id: 'leather',
      keys: ['leather', 'suede', 'faux leather', 'pleather', 'sheepskin', 'fur coat', 'motorcycle gear', 'motorbike gear', 'biker jacket', 'leathers'],
      context: ['wash', 'clean', 'machine', 'safe'],
      text: 'Leather and suede must not go in a washer or dryer, the water and heat stiffen and crack them. Take those to a dry cleaner and we can point you to one nearby.'
    },
    {
      id: 'athletic',
      keys: ['gym clothes', 'gym kit', 'workout clothes', 'workout gear', 'running gear', 'sports kit', 'football kit', 'soccer kit', 'team kit', 'football shirt', 'sports gear', 'activewear', 'sportswear', 'spandex', 'lycra', 'leggings', 'yoga pants', 'jersey', 'still smells after washing', 'sweaty clothes'],
      context: ['smell', 'sweat', 'stink', 'wash', 'gym'],
      text: 'Wash gym kit inside out on cold with a little less detergent than usual, no softener, since softener coats the fibres and traps the smell. A soak in a cup of white vinegar first clears out anything stubborn.'
    },
    {
      id: 'jeans-denim',
      keys: ['jeans', 'denim', 'jean jacket', 'fade', 'faded', 'fading', 'black clothes', 'keep blacks', 'blacks black', 'stretch out'],
      context: ['wash', 'cold', 'dark', 'shrink', 'denim', 'dry'],
      avoid: ['bleed', 'dye', 'gasoline', 'petrol', 'motor', 'grease', 'lint', 'fluff'],
      text: 'Wash denim inside out on cold and hang it to dry, or tumble it on low. Heat is what shrinks and fades a pair of jeans, not the washing.'
    },
    {
      id: 'towels',
      keys: ['towels', 'towel', 'not absorbent', 'scratchy', 'stiff towels', 'fluffy towels', 'crunchy'],
      context: ['wash', 'soft', 'dry', 'absorb', 'stiff'],
      avoid: ['gym'],
      text: 'Wash towels warm and skip the fabric softener, it leaves a coating that stops them absorbing. Tumble on medium with a couple of dryer balls to fluff them back up.'
    },
    {
      id: 'pet-laundry',
      keys: ['pet', 'dog', 'cat', 'pet bed', 'pet blanket', 'dog bed', 'cat bed', 'pet hair', 'dog hair', 'cat hair', 'pet odor', 'pet smell', 'dog blanket', 'cat blanket', 'pet bedding', 'dog towel'],
      context: ['wash', 'hair', 'machine', 'smell', 'clean', 'bed', 'blanket'],
      avoid: ['groom', 'vet', 'walk', 'feed'],
      text: 'Pet beds and blankets are fine in our machines. If there is a lot of pet hair, mention it when you drop off so we can give the machine an extra rinse afterward.'
    },
    {
      id: 'bedbugs',
      keys: ['bed bug', 'bedbug', 'lice', 'scabies', 'fleas', 'dust mite', 'mites', 'been ill', 'after being ill', 'been sick', 'someone sick', 'sanitize', 'sanitise', 'disinfect', 'kill germs', 'kill bacteria', 'flu', 'norovirus', 'hot enough to kill', 'infested'],
      context: ['hot', 'kill', 'wash', 'heat', 'clean', 'cycle', 'sheet', 'bedding', 'clothes'],
      text: 'Our machines have a sanitize cycle, and a hot wash followed by 30 minutes on high heat in the dryer is what kills bugs and germs. Bag anything infested before you carry it in and tell the attendant so we can clean the machine afterwards.'
    },

    /* ---------- Laundry know-how ---------- */
    {
      id: 'detergent',
      keys: ['soap', 'detergent', 'washing powder', 'how much detergent', 'how much soap', 'softener', 'fabric softener', 'conditioner', 'sensitive skin', 'scent', 'scented', 'unscented', 'fragrance', 'smell nice', 'smell good', 'smell fresh', 'allergy', 'allergic', 'eczema', 'my own soap', 'bring detergent'],
      context: ['bring', 'use', 'own', 'sell', 'skin', 'much'],
      avoid: ['vending', 'suds', 'overflow'],
      text: 'You are welcome to bring your own detergent, and we sell it on site if you forget. If you have a scent or skin sensitivity, tell the attendant and we will use what you prefer.'
    },
    {
      id: 'pods',
      keys: ['pod', 'pods', 'pac', 'pacs', 'liquid', 'powder', 'liquid or powder', 'powder detergent', 'liquid detergent', 'he detergent', 'high efficiency detergent', 'how many pods'],
      context: ['detergent', 'use', 'many', 'machine', 'work'],
      text: 'Pods work fine in our machines, one for a normal load and two for an extra-large. Drop it into the empty drum before the clothes rather than in the dispenser drawer, or it will not dissolve properly. Liquid and powder both work too, just use the HE amount on the label.'
    },
    {
      id: 'too-many-suds',
      keys: ['too many suds', 'too much soap', 'too much detergent', 'bubbles everywhere', 'suds', 'foam', 'overflow', 'overflowed', 'sudsing'],
      context: ['soap', 'detergent', 'machine', 'bubble', 'much'],
      text: 'Too much detergent is the usual cause, our machines are high-efficiency and need about a third of what an old top loader did. Stop the machine, let the suds settle, then run a rinse-only cycle. Tell the attendant if it has spilled and they will mop it up.'
    },
    {
      id: 'bleach',
      keys: ['bleach', 'chlorine bleach', 'oxygen bleach', 'how much bleach', 'use bleach', 'bleach safe', 'color safe bleach', 'bleach my whites', 'oxiclean'],
      context: ['white', 'much', 'safe', 'use', 'put', 'dispenser', 'load'],
      text: 'Use bleach in the middle dispenser slot, never poured straight onto clothes, and about half a cup for a full load. Oxygen bleach is the safer choice for colours and for anything elastic, chlorine bleach breaks those fibres down over time.'
    },
    {
      id: 'vinegar-soda',
      keys: ['vinegar', 'white vinegar', 'baking soda', 'washing soda', 'borax', 'home remedy', 'natural cleaner'],
      context: ['use', 'add', 'smell', 'soft', 'clean'],
      text: 'Half a cup of white vinegar in the softener slot cuts smells and softens without coating the fibres, and a scoop of baking soda helps with odours and dull whites. Do not use vinegar and bleach in the same load.'
    },
    {
      id: 'water-temp',
      keys: ['water temperature', 'water setting', 'what setting', 'which setting', 'hot water', 'cold', 'cold water', 'warm', 'warm water', 'warm wash', 'what temperature', 'hot or cold', 'which temperature', 'wash on hot', 'wash on cold', 'dirty', 'really dirty', 'heavily soiled', 'muddy'],
      context: ['temperature', 'hot', 'cold', 'warm', 'wash', 'setting'],
      avoid: ['machine', 'store', 'inside', 'winter', 'summer'],
      text: 'Cold water is safe for almost everything and keeps colors from fading. Use warm for towels and bedding, and hot only for whites or anything the care label marks for sanitizing.'
    },
    {
      id: 'sorting',
      keys: ['sort', 'separate', 'color', 'colour', 'new jeans', 'darks and lights', 'whites and colors', 'whites and darks', 'do i need to sort', 'wash together', 'same load'],
      context: ['sort', 'wash', 'together', 'dark', 'light', 'load'],
      avoid: ['bled', 'ran', 'favourite', 'favorite', 'iron', 'press'],
      text: 'Sort darks from lights, and wash brand-new dark items like new jeans on their own the first couple of times, since they can bleed dye onto lighter clothes.'
    },
    {
      id: 'dye-transfer',
      keys: ['red sock', 'turned pink', 'went pink', 'came out pink', 'came out blue', 'dye ran', 'color bled', 'colour bled', 'bleed', 'bled', 'dye transfer', 'color ran', 'colour ran', 'color run', 'colour run', 'stained everything', 'turned everything', 'dyed everything', 'turned blue', 'turned grey', 'onto my other'],
      context: ['pink', 'dye', 'ran', 'white', 'load', 'color', 'blue', 'everything'],
      text: 'Rewash the whole load straight away in cold with a colour-run remover before anything dries, heat is what sets the dye for good. If it has already been through the dryer it is much harder, but a long soak in oxygen bleach is worth a try.'
    },
    {
      id: 'whites',
      keys: ['whiten', 'my whites', 'grey', 'gray', 'yellowing', 'yellowed', 'grey whites', 'dingy', 'brighten', 'dull whites'],
      context: ['white', 'bright', 'dull', 'yellow', 'bleach'],
      avoid: ['pink', 'bled', 'sock', 'dye', 'ran'],
      text: 'To brighten dull whites, wash on the hottest setting the care label allows and add a scoop of oxygen-based bleach powder. Skip chlorine bleach on anything elastic, since it breaks the fibers down over time.'
    },
    {
      id: 'stains',
      keys: ['stain', 'stains', 'red wine', 'grease', 'blood', 'ink', 'oil', 'coffee stain', 'ketchup', 'chocolate', 'grass stain', 'mud', 'wine', 'paint', 'marker', 'sharpie', 'sunscreen', 'treat a stain', 'get out a stain', 'get a stain out', 'spot clean', 'spot treat'],
      context: ['stain', 'out', 'remove', 'get', 'set', 'mark', 'shirt', 'top', 'jeans'],
      avoid: ['parking', 'sweat', 'deodorant', 'armpit', 'bled', 'ran', 'pink'],
      text: 'Tell us about a stain or a delicate item when you drop off and we will treat it separately rather than run it through the standard wash. Washing yourself, cold water and treating a stain before it sets both help a lot.'
    },
    {
      id: 'sweat-stains',
      keys: ['sweat stain', 'armpit', 'armpits', 'under the arms', 'under the arm', 'underarm', 'yellow armpit', 'deodorant', 'deodorant mark', 'deodorant stain', 'white marks on', 'makeup', 'makeup stain', 'mascara', 'foundation', 'lipstick', 'collar ring', 'ring around the collar'],
      context: ['stain', 'yellow', 'white', 'mark', 'shirt', 'out'],
      text: 'For underarm yellowing, rub in a paste of baking soda and a little water, leave it an hour, then wash warm with oxygen bleach. Makeup and deodorant marks lift with dish soap worked in gently before the wash.'
    },
    {
      id: 'gum-wax',
      keys: ['gum', 'chewing gum', 'wax', 'candle wax', 'crayon', 'melted', 'sticker', 'residue', 'sticker residue', 'tape residue', 'glue'],
      context: ['out', 'off', 'stuck', 'remove', 'clothes'],
      text: 'Freeze the item or hold ice on the spot until the gum or wax goes hard, then crack it off. For wax, lay a paper towel over what is left and press with a warm iron so the paper draws it out, then wash as normal.'
    },
    {
      id: 'odor',
      keys: ['musty', 'mildew', 'smelly', 'smells like', 'sour smell', 'smell sour', 'smells sour', 'smell damp', 'smells damp', 'clothes smell', 'laundry smell', 'smells bad', 'smell bad', 'bad smell', 'odor', 'odour', 'stink', 'smoke smell', 'smell of smoke', 'cigarette smell', 'get rid of the smell'],
      context: ['smell', 'wash', 'rinse', 'wet', 'sat'],
      avoid: ['pet', 'dog', 'gym'],
      text: 'A musty smell usually means a load sat wet too long. Rewash it with an extra rinse, and leaving the washer door cracked between loads at home helps stop it happening again.'
    },
    {
      id: 'mold',
      keys: ['mold', 'mould', 'moldy', 'black spots on', 'mold on my clothes', 'mildew stains'],
      context: ['clothes', 'spot', 'remove', 'wash', 'smell'],
      text: 'Soak mouldy items in oxygen bleach and warm water for a few hours, then wash on the hottest setting the label allows. Dry them fully, since anything left damp will bring it straight back.'
    },
    {
      id: 'lint',
      keys: ['lint', 'lint trap', 'lint filter', 'fluff', 'fuzz', 'pill', 'pilling', 'bobbles', 'lint on my clothes', 'white bits'],
      context: ['clothes', 'dark', 'black', 'dryer', 'clean', 'remove', 'knitwear', 'sweater', 'jumper'],
      text: 'Empty the lint trap before every dry, it is the single thing that makes a dryer work properly. Lint on darks usually means they were washed with towels, and pilling comes from friction, so turn knits inside out and wash them on gentle.'
    },
    {
      id: 'static-shrink',
      keys: ['static', 'cling', 'shrink', 'shrunk', 'heat', 'low heat', 'high heat', 'heat setting', 'dryer sheet', 'dryer ball', 'wool ball', 'stretched out', 'came out tiny', 'came out smaller', 'smaller', 'shrank', 'sticks together', 'stick together'],
      avoid: ['store', 'winter', 'summer', 'conditioning', 'inside', 'curtain', 'drape'],
      context: ['dryer', 'heat', 'dry', 'clothes', 'setting', 'shrunk', 'shrink', 'sweater', 'smaller'],
      text: 'A dryer sheet or wool dryer balls cut down on static cling. To avoid shrinking, pull out anything wool, elastic or marked "low heat" while the dryer is still warm rather than fully cycled, or air dry it instead.'
    },
    {
      id: 'ironing',
      keys: ['iron', 'ironing', 'ironing board', 'press', 'pressed', 'steam', 'wrinkle', 'wrinkly', 'wrinkled', 'crease', 'creased', 'come out creased', 'starch'],
      context: ['wrinkle', 'crease', 'flat', 'shirt', 'fold'],
      avoid: ['start'],
      text: 'Wash, dry and fold comes back folded rather than pressed, so we do not iron. Taking things out of the dryer while they are still warm and folding straight away keeps most creases out.'
    },
    {
      id: 'care-labels',
      keys: ['care label', 'care symbol', 'laundry symbol', 'washing symbol', 'the tag mean', 'label mean', 'what does the tag mean', 'symbols on the tag', 'tub icon', 'tub symbol', 'icon mean', 'symbol mean', 'triangle on the label', 'circle on the label', 'triangle', 'crossed out', 'cross through it', 'symbols', 'dots on the label', 'what the label says'],
      context: ['label', 'tag', 'symbol', 'mean', 'wash'],
      text: 'The little tub icon on a care label is the wash guide: dots inside show temperature, and a hand in the tub means hand-wash only. A triangle means bleach is fine, and a crossed-out triangle means no bleach.'
    },
    {
      id: 'how-often',
      keys: ['how often', 'how regularly', 'regularly', 'how often to wash', 'how many times', 'every week', 'between wears'],
      context: ['often', 'week', 'wear', 'wash', 'time', 'sheet', 'towel', 'jeans'],
      text: 'Sheets and towels are typically washed about once a week, and everyday clothes every wear or two. There is no need to overthink it.'
    },
    {
      id: 'hard-water',
      keys: ['hard water', 'soft water', 'water hard', 'water is hard', 'water is really hard', 'really hard', 'hard here', 'water quality', 'limescale', 'limescale in', 'descale', 'scale build up', 'mineral deposit', 'chalky'],
      context: ['water', 'stiff', 'dull', 'home', 'soap'],
      text: 'If your water at home is hard, clothes can come out stiff or dull. A little extra detergent, or a scoop of washing soda, sorts it out. Our machines are set up for the water here, so you do not need to think about it in store.'
    },
    {
      id: 'eco',
      keys: ['eco', 'environment', 'environmentally', 'sustainable', 'high efficiency', 'fragrance free', 'green', 'water usage', 'how much water', 'water do they use', 'use less water', 'waste water', 'energy', 'carbon'],
      context: ['water', 'friendly', 'use', 'less', 'machine', 'detergent', 'soap', 'option'],
      text: 'Our machines are high-efficiency and use less water per load than most home washers. We are happy to use a fragrance-free or eco detergent if you ask.'
    },

    /* ---------- Being in the store ---------- */
    {
      id: 'attendant',
      keys: ['attendant', 'staff', 'someone', 'somebody', 'anyone', 'anybody', 'a person', 'working there', 'first time', 'first timer', 'help', 'can someone help', 'someone help', 'help me start', 'never been', 'never used', 'never done', 'im new', 'new to laundromats', 'show me', 'walk me through', 'new to this'],
      context: ['machine', 'use', 'help', 'ask', 'there', 'show'],
      avoid: ['bot', 'human', 'manager', 'complaint', 'carry', 'heavy', 'wheelchair', 'walker', 'stolen', 'stole', 'theft', 'lost', 'hiring', 'job', 'apply', 'thanks', 'thank', 'cheers', 'appreciate'],
      text: 'Yes, an attendant is on site every hour we are open. If you are not sure which machine to use or how much soap to add, just ask. We are happy to walk you through it.'
    },
    {
      id: 'amenities',
      keys: ['wifi', 'wi fi', 'internet', 'seating', 'somewhere to sit', 'anywhere to sit', 'to sit', 'chairs', 'restroom', 'bathroom', 'toilet', 'folding table', 'table', 'table to fold', 'somewhere to hang', 'to do while i wait', 'anything to do', 'charger', 'charge my phone', 'charge it', 'somewhere to charge', 'can i charge', 'outlet', 'plug', 'socket', 'tv', 'television', 'music', 'magazine', 'magazines', 'vending snacks', 'water fountain', 'drink of water', 'drinking water', 'somewhere to fill'],
      context: ['wait', 'sit', 'free', 'have', 'use', 'while'],
      avoid: ['eat', 'food', 'drink', 'coffee', 'snack', 'smoke', 'vape'],
      text: 'We have free Wi-Fi, clean restrooms, comfortable seating, and a folding table at every station, so it is a comfortable place to wait out a cycle.'
    },
    {
      id: 'trash',
      keys: ['trash', 'trash can', 'garbage', 'rubbish', 'bin', 'bins', 'throw away', 'throw it away', 'throw this away', 'throw out', 'throw this out', 'chuck', 'dispose', 'recycling', 'recycle', 'empty bottle', 'empty detergent bottle'],
      context: ['put', 'where', 'store', 'empty', 'throw'],
      avoid: ['clothes', 'donate', 'donation', 'lint'],
      text: 'There are bins at the end of each row for empty bottles and used dryer sheets, and a lint bin beside the dryers. Anything bigger, hand it to the attendant rather than wedging it in.'
    },
    {
      id: 'work-study',
      keys: ['work on my laptop', 'work from', 'work while i wait', 'get some work done', 'do homework', 'homework', 'study', 'studying', 'revise', 'take a call', 'phone call', 'zoom', 'video call', 'meeting', 'quiet enough', 'noisy in there', 'how loud', 'loud in there', 'noise level', 'peaceful'],
      context: ['wait', 'laptop', 'wifi', 'quiet', 'work', 'there', 'while', 'call', 'loud', 'noise', 'homework'],
      avoid: ['machine broke', 'banging', 'grinding'],
      text: 'Plenty of people work or study straight through a cycle. There is free Wi-Fi, seating and outlets by the folding tables. The machines hum away in the background, so a phone call is fine, but a quiet video meeting is a stretch on a busy Saturday.'
    },
    {
      id: 'machine-hygiene',
      keys: ['cleaned between', 'clean between customers', 'after each customer', 'wipe the drum', 'wipe down the machine', 'need a wipe', 'wipe', 'germs', 'who used it before', 'used it before me', 'used the machine before', 'before me', 'shared machines', 'catch something', 'germs from the machine', 'immunocompromised', 'immune system', 'is it safe to use', 'safe to use', 'chemo', 'newborn at home', 'run an empty cycle'],
      context: ['machine', 'clean', 'germ', 'wash', 'before', 'safe'],
      text: 'Commercial washers rinse themselves out with fresh water on every cycle, and the attendant wipes the drums and doors through the day. If you would rather be certain, run a short hot cycle empty first, it costs the price of a small wash, or use the sanitize option on your own load.'
    },
    {
      id: 'cleanliness',
      keys: ['is the place clean', 'is it clean', 'how clean', 'clean machines', 'cleaned', 'sanitary', 'hygiene', 'hygienic', 'dirty machine', 'was dirty', 'filthy', 'grimy', 'gross', 'smell in the store'],
      context: ['clean', 'store', 'machine', 'place'],
      avoid: ['disinfect', 'bug', 'dress', 'cover', 'fabric', 'house', 'home', 'carpet', 'office', 'jacket', 'coat'],
      text: 'The store is cleaned through the day and the attendant keeps on top of the machines and folding tables. If you ever find a machine left in a mess, tell them and they will sort it straight away.'
    },
    {
      id: 'kids',
      keys: ['kid', 'children', 'child', 'baby', 'stroller', 'pram', 'bring my kid', 'my son', 'my daughter', 'toddler', 'family'],
      context: ['bring', 'with', 'allow', 'ok', 'wait'],
      avoid: ['clothes', 'detergent', 'blanket', 'wash', 'allergic', 'fragrance', 'skin', 'job', 'hiring', 'work'],
      text: 'You are welcome to bring the kids along. There is seating and room to wait, just keep an eye on them around the machines.'
    },
    {
      id: 'age',
      keys: ['how old', 'age limit', 'minor', 'teenager', 'year old', 'years old', 'under 18', 'old enough', 'by themselves', 'on their own'],
      context: ['old', 'age', 'alone', 'kid', 'allow'],
      text: 'There is no age limit on using the machines, and plenty of students come in on their own. Younger children should have an adult with them, since the machines are heavy and hot.'
    },
    {
      id: 'pets-in-store',
      keys: ['bring my dog', 'bring my cat', 'bring my pet', 'dog inside', 'pets allowed', 'dog allowed', 'service animal', 'service dog', 'guide dog', 'emotional support', 'tie my dog', 'dog outside', 'dog', 'cat', 'pet'],
      context: ['bring', 'inside', 'store', 'allow', 'with'],
      avoid: ['bed', 'blanket', 'hair', 'wash', 'towel', 'groom', 'vet'],
      text: 'Service animals are welcome anywhere in the store. Other pets are best left at home, since there is not much room between the machines and the folding tables.'
    },
    {
      id: 'smoking',
      keys: ['smoking', 'can i smoke', 'smoke outside', 'no smoking', 'vape', 'vaping', 'cigarette'],
      context: ['inside', 'store', 'allow', 'outside'],
      avoid: ['smell', 'stain'],
      text: 'There is no smoking or vaping inside the store. You are welcome to step outside, just keep an eye on your cycle.'
    },
    {
      id: 'food-drink',
      keys: ['food', 'food and drink', 'bring a drink', 'eat', 'eat while', 'coffee', 'snack', 'lunch', 'soda', 'water bottle'],
      context: ['bring', 'inside', 'while', 'wait', 'allow'],
      avoid: ['stain', 'spill'],
      text: 'A coffee or a snack while you wait is fine, we just ask you to clear up after yourself and keep drinks off the folding tables.'
    },
    {
      id: 'vending',
      keys: ['vending', 'vending machine', 'buy detergent', 'sell detergent', 'buy soap', 'sell soap', 'sell dryer sheets', 'buy dryer sheets', 'forgot my detergent', 'forgot my soap', 'forgot soap', 'do you sell it', 'out of detergent'],
      context: ['buy', 'sell', 'store', 'forgot', 'detergent'],
      text: 'There is a vending wall in the store selling detergent, dryer sheets and other bits, so you can pick up anything you forgot without leaving.'
    },
    {
      id: 'lockers',
      keys: ['locker', 'store my bag', 'leave my bag', 'leave my shopping', 'leave my things', 'somewhere to put my stuff', 'somewhere for my bags', 'hold my things', 'mind my bag'],
      context: ['leave', 'put', 'bag', 'safe', 'store'],
      text: 'There are no lockers, so keep your bag with you at the folding tables. The attendant will hold something behind the counter for a few minutes if you need to nip out.'
    },
    {
      id: 'booking',
      keys: ['book', 'turn up', 'arrange', 'arrange a time', 'book ahead', 'book in advance', 'book a machine', 'book a time', 'book me in', 'need to book', 'make a booking', 'reservation', 'reserve', 'reserve a machine', 'schedule a time', 'walk in', 'walk ins', 'walk in only', 'call ahead', 'call first', 'appointment', 'time slot', 'do i need to call first'],
      context: ['book', 'ahead', 'need', 'walk', 'first'],
      avoid: ['hotel', 'restaurant', 'flight', 'taxi', 'app'],
      text: 'There is nothing to book ahead and no form to fill in. Walk in any time we are open, and for wash, dry and fold just bring your bag to the counter.'
    },

    /* ---------- Problems and getting hold of us ---------- */
    {
      id: 'lost-found',
      keys: ['lost', 'missing item', 'missing sock', 'lost a sock', 'left a sock', 'hand in', 'handed in', 'did anyone find', 'anyone find', 'anyone hand in', 'turned up', 'in the lost and found', 'left something', 'left my', 'left a', 'left behind', 'leave behind', 'forgot something', 'lost and found', 'did i leave', 'left my keys', 'left my phone'],
      context: ['left', 'lost', 'find', 'behind', 'yesterday'],
      avoid: ['detergent', 'ticket', 'money', 'poster', 'flyer', 'advertise', 'notice'],
      text: 'If you think you left something behind, call us at <a href="tel:+15550192847">(555) 019-2847</a> with the day and roughly what time you were in, and the attendant will check the lost and found.'
    },
    {
      id: 'damage',
      keys: ['damage', 'damaged', 'ruined', 'ruin', 'liability', 'insurance', 'insured', 'lost my clothes', 'torn', 'tore', 'wrecked', 'hole', 'came back', 'came back with', 'elses clothes', 'wrong clothes', 'not my clothes', 'button broke', 'broke off', 'order was short', 'missing items', 'items missing', 'shrank my', 'came back wrong', 'missing from my order'],
      context: ['order', 'clothes', 'back', 'my', 'fault'],
      avoid: ['fix', 'repair', 'sew', 'tailor'],
      text: 'Tell the attendant straight away if something comes back damaged or missing. They will look into it there and then, so please check your order before you leave.'
    },
    {
      id: 'theft',
      keys: ['stole', 'stolen', 'someone took my clothes', 'took my clothes', 'my clothes were taken', 'laundry was taken', 'walked off with', 'made off with', 'taken my washing', 'washing is gone', 'theft', 'steal', 'stealing', 'robbed', 'went missing from the machine', 'gone from the machine', 'went through my bag', 'my bag is gone'],
      context: ['clothes', 'laundry', 'bag', 'machine', 'someone', 'gone'],
      avoid: ['money', 'quarter', 'coin', 'dryer took'],
      text: 'Tell the attendant right away and call <a href="tel:+15550192847">' + PHONE + '</a> if you have already left. The floor is covered by cameras and they can look back through the footage with you. Most of the time it turns out someone moved a load to free up a machine, and it is sitting on a folding table.'
    },
    {
      id: 'not-helpful',
      keys: ['useless', 'you are useless', 'youre useless', 'this is useless', 'bot is useless', 'stupid bot', 'dumb bot', 'stupid', 'dumb', 'terrible', 'awful bot', 'you dont understand', 'you do not understand', 'not what i asked', 'that is not what i asked', 'you are not helping', 'not helping', 'wrong answer', 'makes no sense', 'you keep saying', 'you are wrong', 'not answering', 'answering my question', 'didnt answer', 'told me the wrong', 'you said the wrong', 'rubbish'],
      context: ['you', 'answer', 'ask', 'help', 'bot'],
      text: 'Sorry, that one is on me. I work by matching your question against a fixed list, so I miss things a person would catch straight away. Try it in a few plain words, like "how much to dry" or "do you do drop off", or call <a href="tel:+15550192847">' + PHONE + '</a> and the attendant will answer anything I cannot.'
    },
    {
      id: 'human',
      keys: ['talk to a person', 'speak to a person', 'talk to someone', 'speak to someone', 'real person', 'talk to a human', 'human', 'representative', 'agent', 'manager', 'complaint', 'complain', 'report a problem', 'report an issue', 'who do i tell', 'customer service', 'in charge', 'the owner', 'never coming back', 'never using you again', 'lost a customer', 'escalate', 'head office'],
      context: ['talk', 'speak', 'call', 'real', 'person'],
      text: 'Of course. Call <a href="tel:+15550192847">' + PHONE + '</a> and you will get the attendant on the counter, or come in and ask for the manager. If something has gone wrong we would rather hear it directly.'
    },
    {
      id: 'contact',
      keys: ['phone', 'phone number', 'number', 'ring you', 'telephone', 'email', 'email address', 'contact', 'contact you', 'contact the store', 'contact details', 'get in touch', 'call you', 'text you', 'whatsapp', 'message you', 'reach you'],
      context: ['call', 'number', 'email', 'reach', 'contact'],
      avoid: ['fix', 'battery', 'repair', 'broken', 'police', 'hospital', 'doctor', 'pizza', 'taxi'],
      text: 'You can call us at <a href="tel:+15550192847">(555) 019-2847</a> or email <a href="mailto:hello@soapzlaundry.com">hello@soapzlaundry.com</a>.'
    },
    {
      id: 'notifications',
      keys: ['text me when', 'text when', 'when ready', 'call me when', 'notify me', 'notification', 'let me know when', 'alert me', 'message when ready'],
      context: ['ready', 'done', 'know', 'text', 'call', 'order', 'number', 'when'],
      text: 'Leave your number on the ticket and the attendant will call you when your order is ready.'
    },
    {
      id: 'reviews',
      keys: ['review', 'reviews', 'yelp', 'google review', 'rating', 'stars', 'feedback', 'feedback form', 'suggestion', 'suggestion box', 'comment card', 'testimonial', 'leave a review'],
      context: ['leave', 'write', 'good', 'online', 'read'],
      text: 'Reviews help a small store more than anything else, so if we did right by you, leave one on Google or Yelp. If we did not, please call <a href="tel:+15550192847">' + PHONE + '</a> first and give us the chance to fix it.'
    },
    /* PLACEHOLDER POLICY: whether we are hiring is the owner’s call, so
       this answer points at the phone rather than inventing one. */
    {
      id: 'jobs',
      keys: ['hiring', 'hire', 'job', 'apply', 'application', 'employment', 'work here', 'need staff', 'part time', 'full time', 'take on staff', 'taking on', 'taking anyone on', 'taking on anyone', 'looking for work', 'vacancy', 'position', 'positions open', 'resume'],
      context: ['work', 'job', 'apply', 'staff', 'hiring', 'open', 'looking', 'son', 'daughter', 'anyone'],
      avoid: ['clothes', 'uniform', 'wash'],
      text: 'Ask the attendant at the counter, or call <a href="tel:+15550192847">' + PHONE + '</a>. If we are taking applications they will point you the right way.'
    },
    {
      id: 'website',
      keys: ['website', 'web site', 'online', 'instagram', 'facebook', 'twitter', 'tiktok', 'social media', 'your page'],
      context: ['site', 'online', 'follow', 'page', 'find'],
      avoid: ['book', 'order', 'pay'],
      text: 'You are on it. This site covers our hours, prices, both services and how to find us. For anything it does not answer, call <a href="tel:+15550192847">' + PHONE + '</a>.'
    },
    /* PLACEHOLDER POLICY: which languages the attendants speak is the
       owner’s call, so this answer points at the phone rather than
       inventing one. */
    {
      id: 'language',
      keys: ['spanish', 'espanol', 'language', 'languages', 'bilingual', 'speak spanish', 'speak french', 'speak polish', 'speak somali', 'speak vietnamese', 'another language', 'other languages', 'hablas'],
      avoid: ['translate', 'into'],
      context: ['speak', 'staff', 'someone', 'english'],
      text: 'Call <a href="tel:+15550192847">' + PHONE + '</a> and we will tell you who is on that day. The attendants are used to helping people through it whatever the language.'
    },

    /* ---------- Talking to Soapzy ---------- */
    {
      id: 'memory',
      keys: ['remember me', 'do you remember', 'remember what i said', 'remember what i asked', 'remember my last', 'remember our', 'what did i just ask', 'what did i ask', 'earlier i asked', 'forget what i said', 'you forgot', 'conversation history', 'record of our chat', 'keep a record', 'save my chat', 'store my questions', 'privacy', 'keep a record of me'],
      context: ['remember', 'ask', 'said', 'before', 'earlier', 'me'],
      text: 'I only see the question you have just asked, and the one before it if the two go together. I do not keep a record of your visits, your orders or anything you tell me. For anything that needs looking up, call <a href="tel:+15550192847">' + PHONE + '</a> and the attendant can pull up your ticket.'
    },
    {
      id: 'capabilities',
      keys: ['what can you do', 'what do you know', 'what can i ask', 'can i ask you', 'things can i ask', 'sort of things', 'are you a bot', 'are you a robot', 'are you real', 'are you a real person', 'are you a person', 'are you human', 'are you ai', 'an ai', 'ai', 'a bot', 'talking to a machine', 'can you answer', 'what can you help', 'you help with', 'what questions', 'what you do', 'who are you', 'your name', 'what are you', 'who made you', 'who wrote you', 'who built you', 'who created you'],
      context: ['you', 'ask', 'help', 'bot', 'know'],
      text: 'I am Soapzy, the mascot, answering questions about Soapz from a fixed list. Ask me about hours, prices, parking, wash, dry and fold, or general laundry things like stains, care labels and fabric care. Anything I cannot answer, the attendant can, on <a href="tel:+15550192847">' + PHONE + '</a>.'
    },
    {
      id: 'small-talk',
      weak: true,
      keys: ['how are you', 'how are you doing', 'hows it going', 'how is it going', 'you doing ok', 'how have you been', 'hows your day', 'good day so far', 'whats up', 'what are you up to'],
      context: ['you', 'today', 'doing'],
      text: 'Doing well, thank you, it is warm work standing next to the dryers all day. What can I help you with?'
    },
    {
      id: 'joke',
      weak: true,
      keys: ['tell me a joke', 'a joke', 'joke', 'something funny', 'make me laugh', 'sing', 'song', 'poem', 'riddle', 'fun fact', 'entertain me', 'bored'],
      context: ['tell', 'me', 'funny', 'know'],
      text: 'Here is the only one I know: why did the sock stay home from the party? It could not find its match. Anything I can actually help with while you wait?'
    },
    {
      id: 'greeting',
      weak: true,
      /* soapzee and soapzie are here because the fuzzy check only forgives a
         single edit, and both are two away from "soapzy". A name heard rather
         than read gets spelled the way it sounds. */
      keys: ['hello', 'hi', 'hey', 'howdy', 'soapzy', 'soapzee', 'soapzie', 'morning', 'good morning', 'good afternoon', 'good evening', 'yo', 'hiya'],
      context: ['soapzy', 'soapzee', 'soapzie'],
      text: 'Hello. Ask me anything about the laundromat, or about laundry in general: hours, prices, parking, stain removal, care labels, or how wash, dry and fold works.'
    },
    {
      id: 'thanks',
      weak: true,
      keys: ['thank', 'cheers', 'appreciate', 'great help', 'helpful', 'that helps', 'that helped', 'perfect', 'awesome'],
      context: ['you', 'much', 'help'],
      text: 'Any time. Anything else you would like to know?'
    },
    {
      id: 'bye',
      weak: true,
      keys: ['bye', 'goodbye', 'see you', 'later', 'that is all', 'thats all', 'thats everything', 'nothing else', 'no thanks'],
      context: ['bye', 'all', 'done'],
      text: 'Take care, and see you at the store.'
    }
  ];

  /* Said when nothing scores well enough. It names a few topics rather than
     stopping at "I do not know", because a visitor who has been turned away
     once needs to know what a question I can answer looks like. */
  var FALLBACK =
    'I am not sure about that one. I can help with hours, prices, parking, ' +
    'wash, dry and fold, and laundry questions like stains, care labels and ' +
    'fabric care. For anything else the attendant will know, so give us a call ' +
    'at <a href="tel:+15550192847">' + PHONE + '</a> and ask.';

  /* ---------- Matching ----------

     This used to be a plain substring search, which was far too loose to be
     useful: "hi" matched inside "which", "rate" inside "temperature", and a
     single common word like "time" outweighed a whole phrase. So the question
     and the keywords are both reduced to stemmed words, a multi-word key has
     to match as consecutive words, and a phrase counts for much more than a
     lone word.

     One keyword on its own is often not enough to tell what is being asked,
     because the same word turns up in questions about different things:
     "dry" belongs to the dryers, to dry cleaning and to air drying a sweater;
     "change" is either the change machine or changing a pickup time. So an
     entry is also scored on the rest of the sentence. Its context words add to
     a topic that already matched, and its avoid words take away from one, which
     is what settles those questions between topics that share a keyword.

     Four things sit on top of that, each with its own block further down:

       typos are forgiven, but only for words the answers do not already know
       (VOCAB), because correcting a real word does more harm than good;
       a key that matched inside the words another key of the same entry
       already matched does not score twice;
       a genuinely two-part question gets both answers;
       a follow-up too short to stand on its own is read together with the
       question before it.

     Anything that cannot clear MIN_SCORE gets the fallback, which is more use
     to a visitor than a confident wrong answer. */

  /* An exact single word scores 4 and a fuzzy one 3, so a lone approximate
     match is still enough to answer on, and an exact match always outranks
     a fuzzy one. */
  var MIN_SCORE = 3;

  /* A context word is worth less than the keyword it supports, and only so
     many of them count, so that a pile of weak hints can never outweigh the
     phrase the visitor actually typed. */
  var CONTEXT_WEIGHT = 2;
  var CONTEXT_CAP = 6;

  /* An avoid word has to be able to beat a single keyword, otherwise it would
     not change the answer in the cases it exists for. */
  var AVOID_WEIGHT = 5;

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

    var stripped = false;
    if (/ing$/.test(word) && word.length > 5) { word = word.slice(0, -3); stripped = true; }
    else if (/ed$/.test(word) && word.length > 4) { word = word.slice(0, -2); stripped = true; }

    /* So "tipping" lands on "tip" and "dropped" on "drop". Only after a suffix
       came off: applied to every word it also turns "ball" into "bal" while
       "balls" stops at "ball" through the plural rule above, and the two then
       never meet. */
    if (stripped && /([bdfglmnprt])\1$/.test(word)) word = word.slice(0, -1);
    return word;
  }

  /* Keep the original spelling alongside the stem: a misspelling often does
     not stem the way the correct spelling does ("parking" stems to "park",
     "parkign" does not), so the fuzzy check needs both to compare against. */
  function tokenize(text) {
    /* Apostrophes are dropped rather than split on, so "where's" is one word
       and "don't" does not leave a stray "t" behind. Sentence punctuation is
       kept long enough to mark the word after it as starting something new,
       which is one of the ways a two-part message is spotted further down. */
    var lower = text.toLowerCase().replace(/['’]/g, '').replace(/&/g, ' and ')
      .replace(/wash,?\s*dry,?\s*and\s+fold/g, 'wash dry fold')
      .replace(/wash\s+and\s+fold/g, 'wash fold');
    var pieces = lower.match(/[a-z0-9]+|[?.;!]/g) || [];
    var out = [];
    var brk = false;

    for (var i = 0; i < pieces.length; i++) {
      if (/[?.;!]/.test(pieces[i])) { brk = true; continue; }
      out.push({ raw: pieces[i], stem: stem(pieces[i]), brk: brk });
      brk = false;
    }
    return out;
  }

  /* Words shorter than this only match approximately if a letter was swapped,
     dropped or added: "mcuh" for "much", "wher" for "where". A letter changed
     for a different one is not allowed at this length, because that is what
     turns real words into each other, "plus" into "plug" and "cash" into
     "wash". */
  var FUZZY_SWAP_MIN = 4;

  /* Above this length any single edit is allowed. Both words have to clear it:
     one edit apart means nothing between "hi" and "hire". */
  var FUZZY_MIN = 5;

  /* Returns how far apart two words are: false for more than one edit, 'swap'
     when it is two neighbours the wrong way round, 'edit' for a letter added,
     dropped or changed. That is enough to reach "detergant", "parkign" and
     "stian" from their keyword. */
  function oneEditApart(a, b) {
    if (a === b) return 'same';
    var la = a.length;
    var lb = b.length;
    if (Math.abs(la - lb) > 1) return false;

    var i = 0;
    var j = 0;
    var edits = 0;
    var kind = la === lb ? 'sub' : 'gap';

    while (i < la && j < lb) {
      if (a.charAt(i) === b.charAt(j)) { i++; j++; continue; }
      if (++edits > 1) return false;

      if (la === lb) {
        if (a.charAt(i + 1) === b.charAt(j) && a.charAt(i) === b.charAt(j + 1)) {
          kind = 'swap';
          i += 2; j += 2;          /* two letters swapped */
        } else {
          i++; j++;                /* one letter different */
        }
      } else if (la > lb) {
        i++;                       /* a has an extra letter */
      } else {
        j++;                       /* a is missing a letter */
      }
    }
    if (i < la || j < lb) edits++;
    return edits <= 1 ? kind : false;
  }

  /* Both words must also start with the same letter, which is what keeps
     "weather" off "leather" and "wash" off "cash" while still letting through
     the typos people actually make, nearly all of which are a letter dropped,
     doubled or swapped somewhere after the first. */
  function fuzzyPair(a, b) {
    var shortest = Math.min(a.length, b.length);
    if (shortest < FUZZY_SWAP_MIN) return false;
    if (a.charAt(0) !== b.charAt(0)) return false;

    var kind = oneEditApart(a, b);
    if (!kind) return false;
    return shortest >= FUZZY_MIN || kind === 'swap' || kind === 'gap';
  }

  /* Every word used by any keyword, filled in when the answers are compiled.
     A word that is in here is a word we know, so it is never treated as a
     misspelling of a different one: "store" stays "store" and does not become
     "storm", "stuff" does not become "staff", "whites" does not become
     "whiten". Spellcheckers work the same way, and without it the fuzzy match
     does more harm on real words than it does good on typos. */
  var VOCAB = {};

  /* Ordinary English seeded into the same list. None of these is a keyword of
     anything, but each one is a letter away from one: "could" is not a typo of
     "cold", "there" is not "three", "sing" is not "singed". A question is far
     likelier to contain one of these words than a misspelling that happens to
     look like one, so they are treated as words we know. */
  var COMMON = ['about', 'after', 'again', 'been', 'being', 'come', 'could', 'does', 'done', 'dont', 'each', 'even', 'ever', 'every', 'from', 'give', 'gone', 'have', 'here', 'into', 'just', 'know', 'like', 'made', 'make', 'many', 'more', 'most', 'much', 'must', 'need', 'next', 'once', 'only', 'over', 'said', 'same', 'says', 'some', 'sure', 'take', 'tell', 'than', 'that', 'their', 'them', 'then', 'there', 'these', 'they', 'thing', 'think', 'this', 'those', 'told', 'very', 'want', 'what', 'when', 'where', 'which', 'while', 'will', 'with', 'would', 'your'];

  for (var cw = 0; cw < COMMON.length; cw++) VOCAB[COMMON[cw]] = true;

  function known(token) {
    return VOCAB[token.raw] === true || VOCAB[token.stem] === true;
  }

  function tokenMatches(qTok, kTok) {
    if (qTok.stem === kTok.stem || qTok.raw === kTok.raw) return true;
    if (known(qTok)) return false;
    return fuzzyPair(qTok.raw, kTok.raw) || fuzzyPair(qTok.stem, kTok.stem);
  }

  /* Looks for seq in tokens as consecutive words. Returns null when it is not
     there, otherwise where it matched and whether it only matched by way of
     the fuzzy comparison — an exact match is worth slightly more. The position
     is what lets a two-part question be recognised further down. */
  function findSequence(tokens, seq) {
    for (var i = 0; i + seq.length <= tokens.length; i++) {
      var hit = true;
      var fuzzy = false;

      for (var j = 0; j < seq.length; j++) {
        var q = tokens[i + j];
        var k = seq[j];
        if (q.stem === k.stem || q.raw === k.raw) continue;
        if (tokenMatches(q, k)) { fuzzy = true; continue; }
        hit = false;
        break;
      }
      if (hit) return { fuzzy: fuzzy, at: i, end: i + seq.length };
    }
    return null;
  }

  /* True if any word of the question matches this single word. Context and
     avoid words are looked for anywhere in the sentence rather than next to
     the keyword, since "is it much to dry a load" and "how much does the
     dryer cost" put them in different places. */
  function hasWord(tokens, word) {
    for (var i = 0; i < tokens.length; i++) {
      if (tokenMatches(tokens[i], word)) return true;
    }
    return false;
  }

  /* Context and avoid lists are single words. Anything with a space in it is
     split rather than glued together, so a two-word entry slipped into one of
     those lists degrades into two hints instead of matching nothing. */
  function compileWords(list) {
    var out = [];
    for (var i = 0; list && i < list.length; i++) {
      var words = list[i].toLowerCase().replace(/[^a-z0-9]+/g, ' ').split(' ');
      for (var j = 0; j < words.length; j++) {
        if (words[j]) out.push({ raw: words[j], stem: stem(words[j]) });
      }
    }
    return out;
  }

  /* Compile each keyword once into its stemmed words and what a match earns.
     A one-word key that is only a stopword is dropped, since it would match
     everything. A phrase built entirely from stopwords is kept: "where are
     you" and "what can you do" are made of nothing but common words and are
     still the whole question. */
  for (var a = 0; a < ANSWERS.length; a++) {
    var compiled = [];
    var groups = {};

    for (var c = 0; c < ANSWERS[a].keys.length; c++) {
      var seq = tokenize(ANSWERS[a].keys[c]);
      if (!seq.length) continue;
      if (seq.length === 1 && STOPWORDS.indexOf(seq[0].raw) !== -1) continue;

      var norm = [];
      for (var s = 0; s < seq.length; s++) {
        VOCAB[seq[s].raw] = true;
        VOCAB[seq[s].stem] = true;
        norm.push(seq[s].stem);
      }

      /* Keywords that reduce to the same stems are one keyword written more
         than one way: "dryer" and "dryers", "tip" and "tipping". Both spellings
         stay, because the longer one is often what a misspelling can be
         matched against, but the group scores once. Otherwise an entry that
         happened to list two forms of a word quietly counted it twice. */
      norm = norm.join(' ');
      if (groups[norm]) {
        groups[norm].seqs.push(seq);
        continue;
      }
      groups[norm] = { seqs: [seq], weight: seq.length === 1 ? 4 : 6 * seq.length };
      compiled.push(groups[norm]);
    }
    ANSWERS[a].compiled = compiled;
    ANSWERS[a].contextWords = compileWords(ANSWERS[a].context);
    ANSWERS[a].avoidWords = compileWords(ANSWERS[a].avoid);
  }

  /* Scores every entry against the question and returns them sorted, best
     first. Split out from bestAnswer so the tests can see the runner-up and
     the margin between them, not just the winner. */
  function rank(question) {
    var tokens = tokenize(question);
    var scored = [];

    for (var i = 0; i < ANSWERS.length; i++) {
      var entry = ANSWERS[i];
      var score = 0;
      var longest = 0;
      var covers = {};
      var penalised = false;
      var keys = entry.compiled;
      var k;

      var hits = [];

      for (k = 0; k < keys.length; k++) {
        var seqs = keys[k].seqs;
        var found = null;

        /* Any spelling in the group counts, and an exact hit beats a fuzzy
           one, so the search stops early only once it has an exact match. */
        for (var v = 0; v < seqs.length; v++) {
          var hit = findSequence(tokens, seqs[v]);
          if (hit && (!found || (found.fuzzy && !hit.fuzzy))) found = hit;
          if (found && !found.fuzzy) break;
        }

        if (found) {
          found.weight = keys[k].weight - (found.fuzzy ? 1 : 0);
          found.words = seqs[0].length;
          hits.push(found);
        }
      }

      /* Longest first, because a key that matched inside the words another key
         already matched is the same match written twice: "not ready" sitting
         inside "is not ready" used to score both. Only the longer one counts.
         A key that matched somewhere else in the sentence still does, which is
         what a two-part question needs. */
      hits.sort(function (x, y) { return y.weight - x.weight; });

      for (k = 0; k < hits.length; k++) {
        var span = hits[k];
        var fresh = false;
        for (var t = span.at; t < span.end; t++) {
          if (!covers[t]) fresh = true;
        }
        if (!fresh) continue;

        score += span.weight;
        if (span.words > longest) longest = span.words;
        for (t = span.at; t < span.end; t++) covers[t] = true;
      }

      /* Context and avoid only adjust a topic the question already reached.
         On their own they must never be able to answer anything. */
      if (score > 0) {
        var bonus = 0;
        for (k = 0; k < entry.contextWords.length; k++) {
          if (hasWord(tokens, entry.contextWords[k])) bonus += CONTEXT_WEIGHT;
        }
        score += Math.min(bonus, CONTEXT_CAP);

        for (k = 0; k < entry.avoidWords.length; k++) {
          if (hasWord(tokens, entry.avoidWords[k])) { score -= AVOID_WEIGHT; penalised = true; }
        }
      }

      if (score > 0) {
        scored.push({
          entry: entry,
          score: score,
          longest: longest,
          covers: covers,
          penalised: penalised,
          order: i
        });
      }
    }

    /* Ties go to whichever entry matched on the longer phrase, so a specific
       answer beats a general one that happened to score level, and after that
       to the earlier entry, which is why the list is ordered specific first. */
    scored.sort(function (x, y) {
      return (y.score - x.score) || (y.longest - x.longest) || (x.order - y.order);
    });
    return scored;
  }

  /* ---------- Two questions in one message ----------

     People bundle: "what are your hours and do you have parking". Answering
     only the stronger half of that reads as if the rest was ignored, so a
     second answer is added when the runner-up is genuinely a separate
     question, which means all three of:

       it matched on different words of the sentence,
       those two runs of words are joined by "and" or a sentence break, and
       neither answer is marked alone, meaning it already covers the ground a
       second one would repeat.

     The joining word is what does the real work. "how much does it cost to dry
     a load" scores for both pricing and the dryers, and "is the parking lot
     well lit" for both parking and security, but neither has a join between
     the two matches: they are one question with two candidate answers, and
     only the better one is given. "hours and parking" is two questions. */
  var JOINERS = ['and', 'also', 'plus', 'too', 'then', 'aswell'];

  function overlaps(a, b) {
    for (var i in a) {
      if (b[i]) return true;
    }
    return false;
  }

  function bounds(covers) {
    var lo = Infinity;
    var hi = -1;
    for (var i in covers) {
      var n = Number(i);
      if (n < lo) lo = n;
      if (n > hi) hi = n;
    }
    return { lo: lo, hi: hi };
  }

  /* True if the words between the two matched runs join them into two
     questions rather than one. */
  function joinedBy(tokens, a, b) {
    var first = bounds(a);
    var second = bounds(b);
    if (second.lo < first.lo) { var swap = first; first = second; second = swap; }
    if (first.hi >= second.lo) return false;

    for (var i = first.hi + 1; i <= second.lo; i++) {
      if (tokens[i].brk) return true;
      if (i < second.lo && JOINERS.indexOf(tokens[i].raw) !== -1) return true;
    }
    return false;
  }

  /* The topics behind an answer: one id, or two when the message asked two
     things, in the order they were asked. bestAnswer is this joined up into
     what the visitor sees, and the tests work in terms of the ids. */
  function resolve(question) {
    var tokens = tokenize(question);
    var scored = rank(question);

    /* "Good morning, could you wash a duvet for me" is a question about
       bedding wearing a hello. The pleasantries are marked weak, which means
       they answer only when nothing else in the sentence does, so a greeting
       can never talk over the thing the person actually came to ask. */
    var real = [];
    for (var w = 0; w < scored.length; w++) {
      if (!scored[w].entry.weak && scored[w].score >= MIN_SCORE) real.push(scored[w]);
    }
    if (real.length) scored = real;

    if (!scored.length || scored[0].score < MIN_SCORE) return [];

    var top = scored[0];
    var pair = null;

    for (var i = 1; i < scored.length; i++) {
      if (scored[i].score < MIN_SCORE) break;
      if (scored[i].entry.alone || top.entry.alone) continue;
      /* An entry one of whose avoid words fired is a topic the sentence
         argues against, so it is never worth adding as a second answer. */
      if (scored[i].penalised) continue;
      if (overlaps(top.covers, scored[i].covers)) continue;
      if (joinedBy(tokens, top.covers, scored[i].covers)) { pair = scored[i]; break; }
    }

    if (!pair) return [top];
    /* Answer them in the order they were asked, not the order they scored. */
    return bounds(top.covers).lo < bounds(pair.covers).lo ? [top, pair] : [pair, top];
  }

  /* ---------- Follow-ups ----------

     "What are your hours?" then "on Sundays?" is one question split over two
     messages, and on its own the second half says nothing. So when a message
     cannot be answered at all, it is tried once more with the last question
     that could be, which turns it into "what are your hours on sundays".

     This only ever runs where the answer would otherwise have been "I am not
     sure", so it can add an answer but never change one. */
  function withFollowUp(question, previous) {
    var hits = resolve(question);
    if (hits.length || !previous) return hits;
    return resolve(previous + ' ' + question);
  }

  function answerTopics(question, previous) {
    return withFollowUp(question, previous).map(function (hit) { return hit.entry.id; });
  }

  function bestAnswer(question, previous) {
    var hits = withFollowUp(question, previous);
    if (!hits.length) return FALLBACK;

    var parts = [];
    for (var i = 0; i < hits.length; i++) parts.push(hits[i].entry.text);
    return parts.join('<br><br>');
  }

  /* ---------- Lifting the panel over the on-screen keyboard ----------

     Opening the chat focuses the input, which raises the keyboard. The panel
     is position:fixed, and a fixed element is placed against the LAYOUT
     viewport, which iOS does not shrink when the keyboard comes up. Left
     alone the panel stays where it was and the keyboard covers the input the
     visitor is being asked to type into. (100dvh does not help: it follows
     browser chrome, not the keyboard.)

     visualViewport reports the part of the screen still showing, so the strip
     it no longer covers is the height of the keyboard, and that is how far
     the panel has to lift. The sums are kept here, free of the DOM, so
     tests/chat-keyboard.test.js can check them on every platform shape
     rather than only the one a phone happens to be holding. */

  /* Below this a shrinking viewport is a browser toolbar sliding away, not a
     keyboard, and the panel should sit still for it. */
  var KEYBOARD_MIN = 80;
  var PANEL_TOP_GAP = 16;      /* breathing room above the panel */

  /* The shortest the panel can be and still show its header, a sliver of the
     conversation and the input. Squashing it below this does not shrink it,
     it just pushes the form out through the bottom, where the panel's
     overflow:hidden cuts the input off. The caller measures the real figure
     from the rendered panel; this is the fallback for when it cannot. */
  var PANEL_MIN_HEIGHT = 210;

  /* layoutHeight   window.innerHeight, the viewport fixed elements sit in
     viewHeight     visualViewport.height, what the keyboard leaves showing
     offsetTop      visualViewport.offsetTop, how far iOS has pushed the page
     restingBottom  the panel's CSS bottom offset, in px
     minHeight      shortest the panel renders without clipping its own input
     Returns null when no keyboard is up, otherwise the bottom and max-height
     to apply. */
  function keyboardFit(view) {
    var hidden = Math.round(view.layoutHeight - view.viewHeight - view.offsetTop);
    if (hidden < KEYBOARD_MIN) return null;

    var floor = view.minHeight || PANEL_MIN_HEIGHT;

    /* What the visible strip has to offer, once the gap above is taken. */
    var available = view.viewHeight - PANEL_TOP_GAP;

    /* Normally the panel keeps its resting offset and simply rides up on top
       of the keyboard. A landscape phone leaves a strip too short for that,
       so the offset gives way first, down to nothing, and the panel comes to
       rest directly on the keyboard. A panel dragged high up the page is
       pulled back down by the same clamp. */
    var lift = Math.min(view.restingBottom, Math.max(available - floor, 0));

    /* When even that is not enough the panel keeps its floor and overflows
       the TOP of the screen rather than shrinking further. Shrinking looks
       tidier in a diagram and is the wrong way round in the hand: the panel
       clips from the bottom, so the casualty is the input the visitor is
       typing into, while what runs off the top is the header they have
       already read. Whatever else gives, the input stays above the keyboard. */
    return {
      hidden: hidden,
      bottom: Math.round(lift + hidden),
      maxHeight: Math.max(Math.round(available - lift), floor)
    };
  }

  /* Under Node there is no page to build, so the file hands out the matching
     internals and stops before anything touches window or document. That is
     what tests/chat-matching.test.js runs against, so the answers under test
     are the ones the site serves rather than a copy that can drift. */
  if (typeof module === 'object' && module.exports) {
    module.exports = {
      ANSWERS: ANSWERS,
      FALLBACK: FALLBACK,
      bestAnswer: bestAnswer,
      answerTopics: answerTopics,
      rank: rank,
      stem: stem,
      keyboardFit: keyboardFit,
      KEYBOARD_MIN: KEYBOARD_MIN,
      PANEL_MIN_HEIGHT: PANEL_MIN_HEIGHT,
      PANEL_TOP_GAP: PANEL_TOP_GAP
    };
    return;
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

    /* The keyboard opening, closing or being swapped for an emoji panel all
       arrive as a visualViewport resize. iOS also scrolls the visual viewport
       out from under a focused field, which moves the panel without resizing
       anything, so both events are worth listening to. */
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', liftOverKeyboard);
      window.visualViewport.addEventListener('scroll', liftOverKeyboard);
    }
    input.addEventListener('focus', liftOverKeyboard);
    input.addEventListener('blur', function () {
      /* Let the keyboard start closing before measuring again. */
      setTimeout(liftOverKeyboard, 100);
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
      liftOverKeyboard();
      /* iOS raises the keyboard over a couple of hundred milliseconds and
         only reports the new viewport once it has settled, so the state right
         after focus() is not the one to trust. */
      setTimeout(liftOverKeyboard, 300);
    } else {
      panel.classList.remove('is-visible');
      restingPanel();
      launcher.focus();
      closeTimer = setTimeout(function () { panel.hidden = true; }, CLOSE_DELAY);
    }
  }

  /* ---------- Keyboard ----------
     keyboardFit above works out the geometry; this puts it on the panel.
     A dragged panel is pinned to coordinates the visitor chose, so it is left
     where they put it. */
  function restingPanel() {
    panel.style.bottom = '';
    panel.style.maxHeight = '';
  }

  /* The shortest this panel actually renders at: its header, its form, and
     enough of the log to see a line of the conversation. Measured rather
     than assumed, so restyling the header or the input cannot quietly leave
     a stale number behind that clips the input on a landscape phone. */
  function panelFloor() {
    var head = panel.querySelector('.chat-head');
    var chrome = (head ? head.offsetHeight : 0) + (form ? form.offsetHeight : 0);
    return chrome ? chrome + 48 : PANEL_MIN_HEIGHT;
  }

  function liftOverKeyboard() {
    if (!window.visualViewport || panel.hidden || panel.style.left) return;

    /* Measure the resting position, not the lifted one left over from the
       last call, or each keyboard opening would stack on the previous. This
       also puts the panel back to its natural size before panelFloor() reads
       the header and form, so a squashed panel cannot under-report. */
    restingPanel();
    var resting = parseFloat(window.getComputedStyle(panel).bottom) || 0;

    var fit = keyboardFit({
      layoutHeight: window.innerHeight,
      viewHeight: window.visualViewport.height,
      offsetTop: window.visualViewport.offsetTop,
      restingBottom: resting,
      minHeight: panelFloor()
    });
    if (!fit) return;

    panel.style.bottom = fit.bottom + 'px';
    panel.style.maxHeight = fit.maxHeight + 'px';
    log.scrollTop = log.scrollHeight;   /* keep the newest answer in view */
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

  /* The last question that got a real answer, so a follow-up like "on
     sundays?" has something to attach itself to. */
  var lastAnswered = null;

  function send(text) {
    input.value = '';
    say('you', escapeHTML(text));

    /* A short "typing" pause so answers do not appear instantly and feel
       machine-like. It also gives a real API call somewhere to land. */
    var pending = say('bot', '<span class="chat-typing"><i></i><i></i><i></i></span>');
    var previous = lastAnswered;

    askSoapzy(text, previous).then(function (answer) {
      pending.querySelector('.chat-bubble').innerHTML = answer;
      log.scrollTop = log.scrollHeight;
      if (answer !== FALLBACK) lastAnswered = text;
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

         function askSoapzy(question, previous) {
           return fetch('/api/ask-soapzy', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ question: question, previous: previous })
           })
             .then(function (r) { return r.json(); })
             .then(function (data) { return escapeHTML(data.answer); })
             .catch(function () { return FALLBACK; });
         }

     Keep the escapeHTML on anything a model writes — the answers below are
     trusted because we wrote them, a model's are not. */
  function askSoapzy(question, previous) {
    return new Promise(function (resolve) {
      setTimeout(function () { resolve(bestAnswer(question, previous)); }, 450);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
