/* Stress test for Ask Soapzy's question matching.

   Run with: node tests/chat-matching.test.js

   Every case is a question a visitor might really type and the topic id it has
   to land on. The point is not that each topic works once, it is that a topic
   holds up across the many ways the same thing gets asked: full sentences and
   two-word fragments, typos, no punctuation, slang, and questions phrased as
   statements or complaints. Cases are grouped by topic, and the groups that
   share a keyword with another topic ("dry", "change", "card", "dog", "help")
   are the ones worth adding to first when a new answer goes in.

   FALLBACK holds the questions that must NOT be answered. A wrong answer given
   confidently is worse than admitting the question is out of scope, so this
   group is part of the test rather than an afterthought. */

var assert = require('assert');
var soapzy = require('../assets/js/chat.js');

/* Question, then the topic id it has to reach. */
var CASES = {
  hours: [
    'what are your hours',
    'what are your opening hours',
    'when do you open',
    'when do you close',
    'what time do you open',
    'what time do you close',
    'are you open right now',
    'are you open today',
    'are you open tomorrow',
    'are you still open',
    'r u open',
    'open now?',
    'hours?',
    'how late are you open',
    'how early do you open',
    'are you open on sunday',
    'you open saturdays',
    'do you open on weekends',
    'whats the latest i can come in',
    'are you a 24 hour laundromat',
    'are you open 24 hours',
    'is it open all night',
    'when is the last wash',
    'what time is the last load',
    'i finish work at 9 are you still open',
    'what time do you shut',
    'when do you shut',
    'wat time do you open',
    'what are ur hours today',
    'opening times',
    'closing time',
    'hours of operation',
    'are you open in the evening',
    'do you open early in the morning'
  ],

  holidays: [
    'are you open on christmas',
    'are you open christmas day',
    'open on thanksgiving?',
    'do you close for holidays',
    'are you open new years day',
    'holiday hours',
    'are you open on easter',
    'you open july 4th',
    'do you shut on bank holidays',
    'are you closed for the holidays'
  ],

  'weather-closure': [
    'are you open when it snows',
    'did the storm close you',
    'are you closed because of the snow',
    'do you close in bad weather',
    'are you open if theres a power outage',
    'is there power at the store'
  ],

  location: [
    'where are you',
    'where are you located',
    'whats your address',
    'address?',
    'where is the laundromat',
    'where is your store',
    'how do i get there',
    'how do i find you',
    'what street are you on',
    'are you on a map',
    'do you have a google maps link',
    'how far are you from downtown',
    'how close are you to me',
    'what part of town are you in',
    'whats your zip code',
    'directions please',
    'give me directions',
    'where abouts are you',
    'whats the cross street',
    'where is your shop located',
    'wheres the store'
  ],

  transit: [
    'can i get there by bus',
    'is there a bus stop nearby',
    'can i take the train',
    'is it walking distance',
    'can i bike there',
    'do you have a bike rack',
    'is there somewhere to lock my bike',
    'can i get an uber there',
    'do you have public transport nearby'
  ],

  parking: [
    'is there parking',
    'do you have parking',
    'where do i park',
    'is parking free',
    'can i park out front',
    'is there a parking lot',
    'do i have to pay to park',
    'can i pull up to the door',
    'can i park my truck there',
    'is there anywhere to unload',
    'is there a meter',
    'parkign available?'
  ],

  accessibility: [
    'is the store wheelchair accessible',
    'is it accessible',
    'can i get in with a walker',
    'are there steps to get in',
    'is the entrance step free',
    'do you have handicap spaces',
    'is there a ramp',
    'i have a bad back can someone help me carry it in',
    'my laundry is too heavy to carry',
    'can someone help me carry my laundry',
    'is the door wide enough for a wheelchair'
  ],

  carts: [
    'do you have carts',
    'can i borrow a cart',
    'are there trolleys to move my laundry',
    'is there a cart i can use',
    'do you have rolling carts'
  ],

  'other-locations': [
    'do you have other locations',
    'is there another soapz',
    'do you have a store on the other side of town',
    'how many locations do you have',
    'is this a franchise'
  ],

  'about-us': [
    'who owns this place',
    'is it family owned',
    'how long have you been open',
    'when did you open',
    'tell me about the business',
    'who runs the laundromat'
  ],

  payment: [
    'do i need quarters',
    'do you take cards',
    'do you accept credit cards',
    'can i pay with a card',
    'can i pay by debit',
    'do the machines take cash',
    'do you take apple pay',
    'can i use google pay',
    'is it card only',
    'do i need coins',
    'do machines take dollar coins',
    'can i pay with venmo',
    'do you take paypal',
    'do you take cash app',
    'is it contactless',
    'can i tap my card',
    'do you take checks',
    'what payment methods do you take',
    'i need quarters',
    'how do the machines take payment',
    'do you take credit',
    'do i need cash',
    'do you accept debit cards',
    'can i pay with my phone',
    'do i have to bring quarters'
  ],

  'when-to-pay': [
    'when do i pay',
    'do i pay when i drop off or pick up',
    'do i pay first',
    'do i pay up front',
    'do i pay at pickup',
    'do i pay in advance',
    'is there a deposit',
    'do i pay at the counter'
  ],

  pricing: [
    'how much does it cost',
    'how much is a wash',
    'what are your prices',
    'whats the price',
    'how much for a load',
    'is it expensive',
    'whats the cheapest option',
    'do you have a price list',
    'what do you charge',
    'how much money should i bring',
    'whats your rate',
    'price of a wash',
    'how much is a load of laundry',
    'cost?',
    'how much r ur washers',
    'how much does a washer cost',
    'is it cheap',
    'what does it cost to wash a load'
  ],

  'per-pound': [
    'how much per pound',
    'whats the price per pound',
    'is there a minimum',
    'whats the minimum order',
    'do you charge by weight',
    'how do you weigh it',
    'is the scale accurate',
    'how many pounds is a normal load',
    'whats the smallest order you take',
    'do you have a minimum for drop off',
    'is it priced per lb'
  ],

  dryer: [
    'how much are the dryers',
    'how much does it cost to dry',
    'how much to dry a load',
    'how long do the dryers take',
    'how long does it take to dry',
    'how many minutes per quarter in the dryer',
    'whats the dryer cost',
    'do dryers take quarters',
    'how long is a dry cycle',
    'dryer prices',
    'how much for the dryer',
    'how long to dry a load of towels'
  ],

  'change-machine': [
    'do you have a change machine',
    'can i get quarters there',
    'where do i get change',
    'can you break a twenty',
    'does the change machine take twenties',
    'is there a bill changer',
    'can i get change for a ten',
    'do you have coin machines'
  ],

  atm: [
    'do you have an atm',
    'is there a cash machine',
    'where is the nearest atm',
    'can i get cash out there'
  ],

  discounts: [
    'do you have any discounts',
    'is there a student discount',
    'do you do senior discounts',
    'any coupons',
    'do you have deals',
    'any specials this week',
    'do you offer a military discount',
    'is there a promotion on'
  ],

  'gift-receipt': [
    'do you sell gift cards',
    'can i buy a gift certificate',
    'can i get a receipt',
    'i need an invoice',
    'do you take ebt',
    'do you accept snap'
  ],

  tipping: [
    'should i tip',
    'do you take tips',
    'is tipping expected',
    'how much should i tip the attendant',
    'is there a tip jar'
  ],

  membership: [
    'do i need an account',
    'do i have to sign up',
    'do i need to register',
  ],

  'wash-fold': [
    'do you wash clothes for me',
    'can you do my laundry',
    'whats wash dry and fold',
    'do you have drop off service',
    'can i drop my laundry off',
    'do you offer full service',
    'can someone else do my washing',
    'do you fold it for me',
    'i dont have time can you do it for me',
    'can i just leave it with you',
    'what is drop off laundry',
    'do you do the laundry for me'
  ],

  turnaround: [
    'how long does wash dry and fold take',
    'when will my laundry be ready',
    'is it same day',
    'can i get it back today',
    'how soon can i pick it up',
    'when can i collect my laundry',
    'how long till my clothes are ready',
    'will it be done by tonight',
    'do i get it back the next day',
    'how long is the turnaround'
  ],

  rush: [
    'can you rush my order',
    'i need it back today',
    'do you do express service',
    'i need my clothes fast',
    'is there a rush option',
    'i need it tonight is that possible',
    'can you do it asap'
  ],

  'track-order': [
    'is my order ready',
    'can i check on my order',
    'whats the status of my order',
    'is my laundry done yet',
    'where is my order'
  ],

  'change-order': [
    'can i cancel my order',
    'can i change my pickup time',
    'can my husband pick it up instead',
    'can someone else pick up my laundry',
    'can i collect it tomorrow instead',
    'i want to add to my order'
  ],

  'order-late': [
    'my order isnt ready',
    'my laundry is not ready yet',
    'why is my order running late',
    'its past the time on my ticket'
  ],

  'separate-loads': [
    'is my laundry washed with other peoples',
    'do you mix my clothes with other customers',
    'is my order washed separately',
    'do you wash it on its own',
    'will my stuff be combined with someone elses'
  ],

  'wash-fold-process': [
    'do you sort my laundry',
    'what detergent do you use',
    'what temperature do you wash at',
    'what settings do you use',
    'can i request a specific detergent',
    'can i give special instructions'
  ],

  'ticket-id': [
    'do i need id to pick up',
    'i lost my ticket',
    'what if i lose my claim ticket',
    'do you give me a ticket when i drop off',
    'do i need to bring the receipt to collect'
  ],

  'fold-only': [
    'can i just use the dryer',
    'can i dry clothes i washed at home',
    'do you do fold only',
    'can you just fold my laundry',
    'can i just wash here and dry at home'
  ],

  'what-to-bring': [
    'what should i bring',
    'do i need to bring my own bag',
    'what do i bring my laundry in',
    'can i bring it in a hamper',
    'do i need anything with me',
    'should i bring a basket'
  ],

  'sell-bags': [
    'do you sell laundry bags',
    'can i buy a mesh bag',
    'do you sell hangers'
  ],

  hangers: [
    'do you hang my clothes',
    'can you put it on hangers',
    'can you air dry my shirts',
    'do you line dry anything',
    'can you hang dry my dresses'
  ],

  'bulk-business': [
    'do you do commercial laundry',
    'can you handle airbnb linens',
    'do you take business accounts',
    'we are a gym do you wash towels in bulk',
    'do you do salon towels',
    'can i set up a regular account for my restaurant'
  ],

  delivery: [
    'do you deliver',
    'do you do pickup and delivery',
    'can you collect from my house',
    'will you come to my home',
    'can you drop it at my apartment'
  ],

  alterations: [
    'do you do alterations',
    'can you hem my pants',
    'can you sew a button back on',
    'do you repair clothes',
    'can you fix a zipper'
  ],

  'dry-clean': [
    'do you dry clean',
    'do you offer dry cleaning',
    'can you clean a suit',
    'this is dry clean only can you wash it',
    'is there a dry cleaner nearby'
  ],

  'machine-sizes': [
    'what size washers do you have',
    'how big are your machines',
    'whats your biggest washer',
    'do you have large machines',
    'which machine should i use',
    'do you have top loaders',
    'are they front loading',
    'what capacity are the washers',
    'do you have extra large washers'
  ],

  'machine-howto': [
    'how do i start the machine',
    'how do i use the washer',
    'where does the soap go',
    'where do i put the detergent',
    'which dispenser does softener go in',
    'what button do i press',
    'how does the washer work'
  ],

  'wash-cycle-time': [
    'how long is a wash cycle',
    'how long does a wash take',
    'how many minutes is a wash',
    'how long does one load take start to finish',
    'whats the cycle length'
  ],

  overloading: [
    'how full should i fill the washer',
    'can i overload the machine',
    'how much fits in one machine',
    'is it bad to stuff the washer',
    'how many clothes fit in a load'
  ],

  'how-many-machines': [
    'how many machines do you have',
    'how many washers are there',
    'how many dryers do you have',
    'are any machines free right now',
    'are there machines available',
    'is there a washer free'
  ],

  busy: [
    'when are you busiest',
    'whats the quietest time',
    'is it usually crowded',
    'whens the best time to come',
    'how long is the wait',
    'is there a queue',
    'when should i come to avoid the crowd',
    'is it packed on saturdays'
  ],

  'broken-machine': [
    'the machine ate my money',
    'a machine is broken',
    'the washer is out of order',
    'the dryer isnt working',
    'the machine is jammed',
    'my machine didnt start',
    'the washer is not draining'
  ],

  'time-limit': [
    'is there a time limit on the machines',
    'how long can i leave my laundry',
    'can i leave my clothes overnight',
    'can i leave and come back',
    'i forgot my clothes in the machine'
  ],

  unattended: [
    'can i leave my laundry unattended',
    'is my stuff safe',
  ],

  etiquette: [
    'someone took my clothes out of the machine',
    'is it rude to put a basket on a machine'
  ],

  bedding: [
    'can i wash a comforter',
    'do you take bedding',
    'can i wash a blanket',
    'will a duvet fit',
    'can i do a king size comforter',
    'do you wash sheets',
    'i have a really big load of bedding'
  ],

  down: [
    'how do i wash a down comforter',
    'can i wash a feather pillow',
    'how do i wash a down jacket',
    'my puffer jacket needs washing',
    'the feathers clumped up'
  ],

  'shoes-rugs': [
    'can i wash shoes',
    'can i put sneakers in the washer',
    'can i wash a rug',
    'can i wash a bath mat'
  ],

  'backpack-gear': [
    'can i wash a backpack',
    'how do i wash a sleeping bag',
    'can i put my gym bag in the washer'
  ],

  uniforms: [
    'can you wash work uniforms',
    'do you wash scrubs',
    'my coveralls are covered in grease',
    'can you do workwear'
  ],

  diapers: [
    'can i wash cloth diapers',
    'how do i wash nappies',
    'whats the best way to wash reusable diapers'
  ],

  'baby-clothes': [
    'how should i wash baby clothes',
    'what detergent is safe for a newborn',
    'do i need special soap for infant clothes'
  ],

  delicates: [
    'how do i wash a wool sweater',
    'can i wash silk',
    'how do i wash lingerie',
    'can i put a bra in the washer',
    'whats the gentle cycle for',
    'can i wash cashmere',
    'is it ok to put wool in the dryer',
    'i have some delicate items',
    'how do i hand wash a jumper'
  ],

  leather: [
    'can i wash a leather jacket',
    'can suede go in the washer',
    'how do i clean sheepskin'
  ],

  athletic: [
    'my gym clothes still smell after washing',
    'how do i wash activewear',
    'can i wash leggings',
    'how do i get the smell out of workout clothes',
    'whats the best way to wash spandex'
  ],

  'jeans-denim': [
    'how do i wash jeans',
    'will my jeans shrink',
    'how do i stop denim fading',
    'should i wash jeans in cold'
  ],

  towels: [
    'my towels are not absorbent anymore',
    'how do i make towels fluffy again',
    'why are my towels scratchy',
    'how should i wash towels'
  ],

  'pet-laundry': [
    'can i wash a dog bed',
    'can you wash my pet bedding',
    'how do i get pet hair out of clothes',
    'my dog blanket smells',
    'can i wash a cat bed here'
  ],

  bedbugs: [
    'can you kill bed bugs in the dryer',
    'how do i wash clothes with lice',
    'how hot does the water get to disinfect',
    'someone in the house has been sick how do i wash the sheets'
  ],

  detergent: [
    'do i need to bring detergent',
    'how much detergent should i use',
    'can i bring my own detergent',
    'do you have unscented detergent',
    'i have sensitive skin',
    'do you use fabric softener',
    'im allergic to fragrance',
    'can i use my own soap',
    'do you provide detergent',
    'what soap do i need',
    'do you have detergant'
  ],

  pods: [
    'can i use pods',
    'do pods work in your machines',
    'how many pods for a big load',
    'is liquid or powder better',
    'do i need he detergent',
    'where do i put a pod'
  ],

  'too-many-suds': [
    'i used too much detergent',
    'theres suds everywhere',
    'the machine is overflowing with bubbles',
    'too much soap in the washer'
  ],

  bleach: [
    'can i use bleach',
    'how much bleach should i use',
    'where does bleach go',
    'is oxygen bleach better',
    'is bleach safe for colors'
  ],

  'vinegar-soda': [
    'can i use vinegar in the wash',
    'does baking soda help',
    'should i add borax',
    'is white vinegar good for laundry'
  ],

  'water-temp': [
    'should i wash in hot or cold',
    'what temperature should i use',
    'is cold water ok',
    'do i need hot water',
    'what temp for really dirty clothes',
    'my clothes are heavily soiled what setting',
    'should i use warm water for towels'
  ],

  sorting: [
    'do i need to sort my laundry',
    'should i separate colors',
    'can i wash whites and colors together',
    'do i have to sort darks and lights',
    'can i wash everything in the same load'
  ],

  'dye-transfer': [
    'a red sock turned my whites pink',
    'the dye ran in my wash',
    'my white shirt went pink',
    'the color bled onto everything',
    'my load came out blue'
  ],

  whites: [
    'how do i whiten my whites',
    'my white shirts have gone grey',
    'how do i fix yellowed whites',
    'my whites look dingy',
    'how do i brighten white clothes'
  ],

  stains: [
    'how do i get a stain out',
    'i spilled red wine on my shirt',
    'how do i remove grease',
    'will a blood stain come out',
    'can you treat stains',
    'i got ink on my shirt',
    'theres a coffee stain on my top',
    'how do i get mud out',
    'grass stain on my kids jeans',
    'do you do stain treatment',
    'can you get chocolate out',
    'how do i get a stian out'
  ],

  'sweat-stains': [
    'how do i get rid of yellow armpit stains',
    'my shirts have deodorant marks',
    'how do i remove sweat stains',
    'theres a ring around the collar',
    'how do i get makeup off a shirt',
    'lipstick on my blouse'
  ],

  'gum-wax': [
    'how do i get gum out of clothes',
    'theres candle wax on my tablecloth',
    'crayon melted in the dryer',
    'a sticker left residue on my shirt'
  ],

  odor: [
    'my clothes smell musty',
    'why does my laundry smell sour',
    'my washing smells bad',
    'how do i get the smoke smell out',
    'clothes smell damp after washing',
    'theres a mildew smell'
  ],

  mold: [
    'how do i get mold out of clothes',
    'my shirt has black mould spots',
    'can you remove mildew stains'
  ],

  lint: [
    'where is the lint trap',
    'my black clothes are covered in lint',
    'do i need to clean the lint filter',
    'why do my sweaters pill',
    'how do i stop bobbles on knitwear'
  ],

  'static-shrink': [
    'how do i stop static',
    'my clothes cling together',
    'will my shirt shrink in the dryer',
    'my sweater shrunk',
    'do you have dryer sheets',
    'should i use dryer balls',
    'what heat setting should i use'
  ],

  ironing: [
    'do you iron',
    'do you press shirts',
    'do you offer ironing',
    'how do i avoid wrinkles',
    'my shirts come out creased',
    'do you steam clothes'
  ],

  'care-labels': [
    'what do the care symbols mean',
    'what does the tag mean',
    'what does the triangle on the label mean',
    'how do i read a laundry symbol',
    'what does the tub icon mean'
  ],

  'how-often': [
    'how often should i wash my sheets',
    'how often should towels be washed',
    'how many times can i wear jeans before washing',
    'how often do you need to do laundry'
  ],

  'hard-water': [
    'is the water hard here',
    'my clothes come out stiff from hard water',
    'does hard water affect washing'
  ],

  eco: [
    'are your machines eco friendly',
    'how much water do they use',
    'do you have green detergent',
    'are they high efficiency',
    'do you have fragrance free options'
  ],

  attendant: [
    'is there someone there to help',
    'is anyone working there',
    'do you have staff on site',
    'is there an attendant',
    'ive never been to a laundromat',
    'its my first time what do i do',
    'can someone show me how it works',
    'i need help',
    'can somebody help me with the machine',
    'is there always a person on duty'
  ],

  amenities: [
    'do you have wifi',
    'is there free wifi',
    'is there somewhere to sit',
    'do you have a bathroom',
    'is there a restroom',
    'are there folding tables',
    'can i charge my phone',
    'are there outlets',
    'is there a tv',
    'what is there to do while i wait'
  ],

  cleanliness: [
    'is the place clean',
    'how clean are the machines',
    'is it sanitary',
    'the machine i used was dirty'
  ],

  kids: [
    'can i bring my kids',
    'is it ok to bring children',
    'can i bring a stroller',
    'is it kid friendly'
  ],

  age: [
    'how old do you have to be to use it',
    'is there an age limit',
    'can my teenager come alone',
    'can a minor use the machines'
  ],

  'pets-in-store': [
    'can i bring my dog',
    'are pets allowed',
    'can i bring my dog inside',
    'do you allow service animals',
    'can my cat come with me'
  ],

  smoking: [
    'can i smoke',
    'is smoking allowed',
    'can i vape inside',
    'is there a smoking area'
  ],

  'food-drink': [
    'can i bring food',
    'can i bring a coffee',
    'is food allowed inside',
    'can i eat while i wait',
    'can i bring a drink in'
  ],

  vending: [
    'do you sell detergent',
    'is there a vending machine',
    'i forgot my detergent',
    'can i buy soap there',
    'do you sell soap',
    'do you sell dryer sheets'
  ],

  lockers: [
    'do you have lockers',
    'can i leave my bag somewhere',
    'is there somewhere to put my stuff'
  ],

  booking: [
    'do i need to book',
    'can i reserve a machine',
    'do i need an appointment',
    'is there a time slot to book',
    'do i need to call ahead first',
    'can i make a reservation'
  ],

  'lost-found': [
    'i left something behind',
    'do you have a lost and found',
    'i think i lost my keys there',
    'i left my phone at the laundromat',
    'i lost a sock'
  ],

  damage: [
    'my clothes came back damaged',
    'you ruined my shirt',
    'something is missing from my order',
    'the machine tore my shirt',
    'are you insured if something is ruined'
  ],

  human: [
    'i want to talk to a person',
    'can i speak to someone',
    'let me talk to a human',
    'i want to speak to the manager',
    'i have a complaint',
    'i want to make a complaint',
    'can i talk to a real person',
    'customer service please'
  ],

  contact: [
    'whats your phone number',
    'how do i contact you',
    'do you have an email',
    'can i call you',
    'whats your email address',
    'how can i get in touch'
  ],

  notifications: [
    'can you text me when its ready',
    'will you call me when its done',
    'do i get a notification when my order is ready'
  ],

  reviews: [
    'where can i leave a review',
    'are you on yelp',
    'can i leave feedback',
    'do you have google reviews'
  ],

  jobs: [
    'are you hiring',
    'do you have any jobs',
    'can i apply for a job',
    'do you have vacancies',
    'i want to work here'
  ],

  website: [
    'do you have a website',
    'are you on instagram',
    'do you have a facebook page',
    'are you on social media'
  ],

  language: [
    'does anyone speak spanish',
    'do you have bilingual staff',
    'hablas espanol',
    'is there someone who speaks french'
  ],

  capabilities: [
    'what can you do',
    'are you a bot',
    'are you a real person',
    'who are you',
    'whats your name',
    'are you ai',
    'what can i ask you'
  ],

  greeting: [
    'hello',
    'hi',
    'hey there',
    'good morning',
    'howdy',
    'hi soapzy'
  ],

  thanks: [
    'thanks',
    'thank you',
    'thanks so much',
    'cheers',
    'that was helpful'
  ],

  bye: [
    'bye',
    'goodbye',
    'see you later',
    'thats all',
    'no thanks thats everything'
  ]
};

/* Second pass over the same topics, asked differently.

   The first pass is mostly the plain form of each question. This one is the
   awkward form: fragments with no verb, statements rather than questions,
   complaints, run-on sentences, text-speak, capitals, punctuation, and typos.
   It also leans hard on the questions where two topics share a word, which is
   where a keyword matcher goes wrong first. */
var HARDER = {
  hours: [
    'whats your schedule',
    'what days are you open',
    'are you open 7 days a week',
    'do you close at 10',
    'till what time are you open',
    'im coming at 9pm will you be open',
    'how late can i do laundry',
    'WHAT TIME DO YOU OPEN',
    'open?',
    'you open sundays?',
    'r u open on sundays',
    'what time do u close today',
    'are you open befor 8am',
    'do you shut early on sundays'
  ],

  holidays: [
    'you open christmas eve',
    'are you working on thanksgiving',
    'do you close on any holidays',
    'open new years eve?'
  ],

  location: [
    'i cant find you',
    'whats the address again',
    'where exactly are you',
    'adress?',
    'what is your locaton',
    'how do i get to your store',
    'are you far from the university',
    'send me directions',
    'which town are you in',
    'is there a map on the site'
  ],

  transit: [
    'is there a bus route that stops there',
    'can i walk from downtown',
    'do you have somewhere to leave a bicycle',
    'i dont have a car can i still get there'
  ],

  parking: [
    'parking?',
    'is parking a nightmare',
    'do i have to pay for parking',
    'can i leave my car while it washes',
    'is there room in the lot',
    'where can i park my van'
  ],

  accessibility: [
    'im in a wheelchair can i get in',
    'my mom uses a walker is that ok',
    'are there any steps',
    'is it easy to get in with a mobility scooter',
    'i cant lift heavy things'
  ],

  payment: [
    'do i have to use quarters',
    'is there a card reader on the machines',
    'coins only?',
    'can i tap to pay',
    'do you take contactless',
    'card or cash',
    'is it cash only',
    'can i use my debit card at the washer',
    'do the washers take credit cards',
    'do u accept aple pay',
    'do you take payment by phone'
  ],

  'when-to-pay': [
    'do i pay before or after',
    'is payment taken at drop off',
    'when am i charged',
    'do i settle up at pickup'
  ],

  pricing: [
    'price?',
    'prices please',
    'whats it gonna cost me',
    'how much do you charge for a wash',
    'is it pricey',
    'give me an idea of the cost',
    'how expensive is it',
    'what are the rates for the washers',
    'how mcuh is a wash'
  ],

  'per-pound': [
    'do you have a minimum charge',
    'is there a minimum weight',
    'whats your per pound rate',
    'how do you price wash dry and fold',
    'do you weigh the bag in front of me'
  ],

  dryer: [
    'dryer cost?',
    'how many quarters for the dryer',
    'is drying included',
    'how long will the dryer take',
    'whats the cost of drying a load',
    'price to dry',
    'how much time does a dryer run for'
  ],

  'change-machine': [
    'i only have notes',
    'will it break a ten',
    'is there somewhere to get coins',
    'what if i dont have change'
  ],

  discounts: [
    'do you run any promotions',
    'are there deals for students',
    'anything cheaper for seniors',
    'do you have a discount for regulars'
  ],

  tipping: [
    'do i need to tip',
    'is it rude not to tip',
    'how much do people usually tip'
  ],

  membership: [
    'do i have to make an account first',
  ],

  'wash-fold': [
    'can you wash and fold for me',
    'i want to drop my clothes off',
    'do you take drop offs',
    'whats the drop off service',
    'i hate doing laundry can you do it',
    'is there a service where you do it all',
    'do you do wash dry and fold'
  ],

  turnaround: [
    'how quick is wash dry and fold',
    'when do i get my clothes back',
    'is it ready the same day',
    'how long till its done',
    'if i drop off this morning when can i collect',
    'do i have to wait around'
  ],

  rush: [
    'i need it in a hurry',
    'can you do it quickly',
    'i need this back before tomorrow morning',
    'whats the fastest you can turn it around'
  ],

  'track-order': [
    'has my order been done',
    'can i check if its ready',
    'is my drop off finished'
  ],

  'change-order': [
    'i need to move my pickup',
    'can my roommate collect it for me',
    'can i cancel the order i just dropped off'
  ],

  'separate-loads': [
    'is my stuff washed with strangers clothes',
    'do you keep my order separate',
    'i dont want my clothes mixed with other peoples'
  ],

  'wash-fold-process': [
    'what soap do you wash with',
    'do you separate my darks and lights',
    'can i ask you to use cold water only',
    'can i leave instructions with my bag'
  ],

  'ticket-id': [
    'what happens if i lose the ticket',
    'do you need to see id',
    'do i get a receipt to collect with'
  ],

  'what-to-bring': [
    'what do i need to bring with me',
    'should i bring my own hamper',
    'do i bring anything besides the clothes'
  ],

  'bulk-business': [
    'we run an airbnb do you do linens',
    'can you handle a weekly commercial order',
    'do you do accounts for small businesses'
  ],

  delivery: [
    'is there a delivery option',
    'do you pick up from homes',
    'could someone come get my laundry'
  ],

  alterations: [
    'can you take up a hem',
    'do you fix rips',
    'is there a tailor there'
  ],

  'dry-clean': [
    'is there dry cleaning here',
    'my coat says dry clean only',
    'can you clean a blazer'
  ],

  'machine-sizes': [
    'what sizes do the washers come in',
    'do you have a machine big enough for a duvet',
    'how large is the biggest one',
    'are the washers front loading or top loading'
  ],

  'machine-howto': [
    'i dont know how to work these machines',
    'where do i pour the detergent',
    'how do i get the washer going',
    'which slot is the softener'
  ],

  'wash-cycle-time': [
    'how long does the washer run',
    'how many minutes does a cycle take',
    'whats the length of a wash'
  ],

  overloading: [
    'can i cram everything into one machine',
    'how much should i put in',
    'is it ok to fill it to the top'
  ],

  'how-many-machines': [
    'how many washing machines are there',
    'are there any free machines right now',
    'is a dryer free'
  ],

  busy: [
    'when is it least busy',
    'is it busy on sunday mornings',
    'whats the quietest time to come',
    'do i have to wait for a machine usually'
  ],

  'broken-machine': [
    'the washer took my quarters',
    'machine swallowed my money',
    'the dryer stopped working halfway',
    'this machine is out of order what do i do',
  ],

  'time-limit': [
    'can i pop out while its washing',
    'how long can i leave it in the dryer',
    'what if i dont come back before you close'
  ],

  unattended: [
    'can i leave my washing and come back',
  ],

  bedding: [
    'will a king comforter fit',
    'can i do my duvet here',
    'i need to wash a heavy blanket',
    'do you have machines for bedding'
  ],

  'shoes-rugs': [
    'is it ok to put trainers in the machine',
    'can i clean a bathroom rug here',
  ],

  uniforms: [
    'my work overalls are filthy',
    'can you wash nurse scrubs'
  ],

  delicates: [
    'whats the safest way to wash a jumper',
    'my dress is hand wash only',
    'can silk go in the machine',
    'how do i wash a wool coat',
    'is there a sink i can use'
  ],

  athletic: [
    'my running gear stinks even after a wash',
    'how do you wash yoga pants',
    'best way to wash sports kit'
  ],

  towels: [
    'my towels feel like sandpaper',
    'why arent my towels soft'
  ],

  'pet-laundry': [
    'i need to wash my dogs blanket',
    'theres dog hair all over my clothes',
    'can the machines handle pet bedding'
  ],

  bedbugs: [
    'will a hot wash kill bed bugs',
    'how do i disinfect my clothes',
    'do the dryers get hot enough to kill germs'
  ],

  detergent: [
    'do i bring my own soap',
    'is detergent included',
    'i need unscented because of my skin',
    'can you use free and clear detergent',
    'do i have to buy your detergent',
    'my daughter is allergic to fragrance'
  ],

  pods: [
    'are tide pods ok',
    'should i use liquid or a pod',
    'how many pods do i need for a big washer'
  ],

  'too-many-suds': [
    'the washer is full of foam',
    'i put too much soap in what now'
  ],

  bleach: [
    'is it ok to add bleach',
    'how much chlorine bleach for a load',
    'which is better oxygen or chlorine bleach'
  ],

  'water-temp': [
    'hot or cold for towels',
    'what temperature kills nothing wait what temp should i use',
    'should i wash everything cold',
    'my clothes are really muddy what setting'
  ],

  sorting: [
    'is sorting really necessary',
    'can whites and darks go together',
    'should i wash new jeans separately'
  ],

  'dye-transfer': [
    'my whole wash turned pink',
    'the colour ran and stained my shirts',
    'a red top bled everywhere'
  ],

  whites: [
    'my t shirts look grey now',
    'how do i get my whites white again',
    'whites gone dingy'
  ],

  stains: [
    'theres a stain on my shirt',
    'wine on the carpet i mean on my top',
    'can you get grease marks out',
    'i have a stained shirt can you treat it',
    'how do you get ketchup out'
  ],

  'sweat-stains': [
    'my white shirts are yellow under the arms',
    'deodorant has built up on my tops'
  ],

  odor: [
    'my clothes stink after being left in the washer',
    'everything smells like mildew',
    'laundry smells sour what do i do'
  ],

  lint: [
    'do i have to empty the lint filter',
    'theres fluff all over my black trousers'
  ],

  'static-shrink': [
    'everything sticks together out of the dryer',
    'my jumper came out tiny',
    'what heat should i dry on',
    'will the dryer shrink my shirt'
  ],

  ironing: [
    'can you press my shirts',
    'do you offer an ironing service',
    'everything comes out wrinkled'
  ],

  'care-labels': [
    'i cant read the washing symbols',
    'what do the dots on the label mean'
  ],

  'how-often': [
    'how regularly should sheets be washed',
    'how often do people wash towels'
  ],

  eco: [
    'are you environmentally friendly',
    'do your machines waste water',
    'can you use eco detergent on my order'
  ],

  attendant: [
    'is somebody there if i get stuck',
    'ive never done this before',
    'can someone walk me through it',
    'is there always staff on site',
    'im new to laundromats'
  ],

  amenities: [
    'is there wifi to use',
    'somewhere to sit while i wait',
    'is there a toilet',
    'can i plug my laptop in'
  ],

  cleanliness: [
    'how hygienic is the place',
    'are the washers cleaned',
    'the last machine i used was gross'
  ],

  kids: [
    'is it ok if i bring my toddler',
    'can children come with me'
  ],

  'pets-in-store': [
    'am i allowed to bring my dog in',
    'is my guide dog welcome',
    'can pets come inside'
  ],

  vending: [
    'can i buy detergent at the store',
    'i forgot soap do you sell it',
    'is there a machine that sells dryer sheets'
  ],

  booking: [
    'do i have to book in advance',
    'can i schedule a time',
    'is it walk in only'
  ],

  'lost-found': [
    'i think i left my jacket there',
    'do you keep things people leave behind',
    'lost my keys at the laundromat'
  ],

  damage: [
    'you shrank my sweater',
    'my shirt came back with a hole',
    'an item is missing from my order'
  ],

  human: [
    'get me a human',
    'i need to speak to a real person',
    'who do i complain to'
  ],

  contact: [
    'phone number please',
    'how do i reach you',
    'whats the best way to contact the store'
  ],

  jobs: [
    'do you need staff',
    'any positions open',
    'im looking for work'
  ],

  language: [
    'anyone there speak spanish',
    'do your staff speak other languages'
  ],

  capabilities: [
    'what sort of things can you answer',
    'am i talking to a machine',
    'are you an actual person or a bot'
  ],

  greeting: [
    'hey',
    'hello there',
    'morning',
    'hi!'
  ],

  thanks: [
    'thanks a lot',
    'thank u',
    'great thanks'
  ]
};

/* The traps: each of these shares a word with another topic, and each has one
   right answer. They are the cases that keyword matching alone gets wrong. */
var AMBIGUOUS = {
  dryer: ['how much does the dryer cost', 'whats the price to dry a load'],
  pricing: ['how much is it to wash', 'what does a wash cost'],
  'dry-clean': ['can you dry clean this jacket'],
  hangers: ['can you air dry my shirts instead'],
  'pets-in-store': ['can my dog come in with me'],
  'pet-laundry': ['can i wash my dogs bedding'],
  'change-machine': ['can i get change for a twenty'],
  'change-order': ['i want to change my pickup time'],
  payment: ['do you take cards at the counter'],
  'gift-receipt': ['do you sell gift cards'],
  amenities: ['is there an outlet to charge my laptop'],
  pricing2: [],
  attendant: ['can someone help me start the machine'],
  capabilities: ['can you help me understand what you do'],
  'lost-found': ['i left my jumper behind'],
  vending: ['i forgot my detergent do you sell any'],
  parking: ['is there parking out front'],
  unattended: ['is it safe to leave my laundry'],
  'time-limit': ['how long can i leave clothes in a machine'],
  stains: ['can you get this stain out'],
  'water-temp': ['what temperature should i wash at'],
  'wash-fold-process': ['what temperature do you wash my order at'],
  bedding: ['can i wash a comforter here'],
  down: ['how do i wash a down filled comforter'],
  towels: ['how do i wash bath towels'],
  'bulk-business': ['do you wash gym towels in bulk'],
  'how-often': ['how often should i wash my towels'],
  'fold-only': ['can i just dry a load here'],
  'wash-cycle-time': ['how long does a wash take'],
  turnaround: ['how long does drop off take to come back'],
  busy: ['how long will i have to wait for a machine'],
  'broken-machine': ['the machine isnt working'],
  'machine-howto': ['how do i work the washer'],
  bleach: ['can i use bleach on my whites'],
  whites: ['how do i brighten my whites'],
  detergent: ['do you sell unscented detergent'],
  eco: ['do you have eco friendly detergent'],
  'baby-clothes': ['what detergent for baby clothes'],
  jobs: ['are you hiring right now'],
  uniforms: ['can you wash my work uniform'],
  smoking: ['can i smoke outside while i wait'],
  'food-drink': ['can i bring a coffee in'],
  kids: ['can i bring my son with me'],
  age: ['can my 15 year old use the machines alone'],
  hours: ['what time do you close tonight'],
  holidays: ['what time do you close on christmas eve']
};
delete AMBIGUOUS.pricing2;

Object.keys(HARDER).forEach(function (id) {
  CASES[id] = (CASES[id] || []).concat(HARDER[id]);
});
Object.keys(AMBIGUOUS).forEach(function (id) {
  CASES[id] = (CASES[id] || []).concat(AMBIGUOUS[id]);
});

/* Third pass. Two things the first two do not cover: questions that carry more
   than one intent ("hi, are you open?"), and the long tail of laundry problems
   people actually walk in with. */
var THIRD = {
  hours: [
    'hi are you open',
    'hello what time do you close',
    'sorry one more thing what time do you open on sunday',
    'quick question are you open now',
    'do you close for lunch'
  ],
  amenities: [
    'thanks one more thing do you have wifi',
    'hi is there a bathroom',
    'is there a table to fold on',
    'do you have somewhere to hang things'
  ],
  'self-service': [
    'do you have self service',
    'is it self serve',
    'whats the difference between self service and drop off',
    'can i do it myself',
    'do i wash it myself or do you',
    'is this a coin laundry or a drop off place',
    'what services do you offer',
    'what do you do here'
  ],
  'still-wet': [
    'my clothes are still wet after the dryer',
    'the dryer isnt drying properly',
    'why is my load still damp',
    'clothes came out wet',
    'the dryer ran but everything is soaked',
    'the dryer is running but no heat'
  ],
  etiquette: [
    'how do i know if a machine is in use',
    'someone left their clothes in the machine i want',
    'what do i do if all the machines are taken',
    'can i take someones clothes out of the dryer'
  ],
  stains: [
    'paint on my jeans',
    'my kid got marker on his shirt',
    'sunscreen stains on my shirt'
  ],
  'gum-wax': [
    'gum stuck to my trousers',
    'wax dripped on the tablecloth'
  ],
  damage: [
    'my order came back damp',
    'i got someone elses clothes in my bag',
    'a button broke off in the wash',
    'my order was short a few items'
  ],
  pricing: [
    'whats the damage',
    'how much are the washers',
    'ballpark price for a load',
    'what does it cost per wash'
  ],
  turnaround: [
    'how many hours does drop off take',
    'is it done in a day',
    'can i wait for it to be finished'
  ],
  detergent: [
    'do i need my own washing powder',
    'whats the best detergent to use',
    'can i use scent free soap',
    'i have eczema what soap should i use'
  ],
  'water-temp': [
    'what water setting for whites',
    'is warm ok for jeans',
    'does hot water clean better'
  ],
  bedding: [
    'can i wash a weighted blanket',
    'will a mattress pad fit in your machines',
    'i need to do all my bedding at once'
  ],
  delicates: [
    'whats the safest cycle for a bra',
    'can i machine wash lace',
    'my cashmere jumper needs cleaning'
  ],
  'shoes-rugs': [
    'are shoes allowed in the washers',
    'can i wash a doormat'
  ],
  'baby-clothes': [
    'is your detergent safe for a baby',
    'how should i wash newborn clothes'
  ],
  kids: [
    'can my children wait with me',
    'is there room for a stroller'
  ],
  'broken-machine': [
    'washer stopped mid cycle',
    'the machine is making a horrible noise',
  ],
  'how-many-machines': [
    'are there enough machines for a big family wash',
    'how many washers are free'
  ],
  busy: [
    'is it usually busy on a saturday morning',
    'whats the wait like in the evening'
  ],
  attendant: [
    'will someone show me what to do',
    'is there help if i get confused'
  ],
  human: [
    'i want to speak to whoever is in charge',
    'let me talk to the owner about a problem',
    'i need to make a complaint about my order'
  ],
  contact: [
    'is there a number i can ring',
    'can i email you'
  ],
  'lost-found': [
    'i left a sock in the dryer',
    'did anyone hand in a watch'
  ],
  'per-pound': [
    'how many pounds is a bag of laundry',
    'is there a charge per pound for drop off'
  ],
  payment: [
    'can i pay by card for drop off',
    'do the machines only take coins'
  ],
  parking: [
    'is the car park free',
    'somewhere to leave the car'
  ],
  location: [
    'what is the street address',
    'are you in springfield'
  ],
  vending: [
    'do you have a machine that sells soap',
    'can i buy dryer sheets there'
  ],
  booking: [
    'can i just turn up',
    'do i need to arrange a time first'
  ],
  eco: [
    'are the machines energy efficient',
    'do you care about the environment'
  ],
  ironing: [
    'do you iron shirts as part of the service',
    'how do i keep shirts from creasing'
  ],
  bedbugs: [
    'i need to kill dust mites in my bedding',
    'how do i wash clothes after being ill'
  ],
  'pet-laundry': [
    'my dogs blanket is covered in hair',
    'how do i get cat hair off a duvet'
  ],
  'pets-in-store': [
    'is my dog allowed in the store',
    'can i tie my dog up outside'
  ],
  'dry-clean': [
    'do you clean suits',
    'my dress says dry clean only what do i do'
  ],
  uniforms: [
    'can you wash chef whites',
    'my scrubs need a hot wash'
  ],
  athletic: [
    'my gym kit smells even when clean'
  ],
  'time-limit': [
    'how long do i have before you close to collect',
    'what if i leave my clothes in overnight'
  ],
  'fold-only': [
    'can i use just the washers',
    'i only want to dry a load'
  ],
  jobs: [
    'do you take on part time staff'
  ],
  capabilities: [
    'what questions can you handle',
    'are you an ai'
  ],
  greeting: [
    'hi there soapzy',
    'good afternoon'
  ]
};

Object.keys(THIRD).forEach(function (id) {
  CASES[id] = (CASES[id] || []).concat(THIRD[id]);
});


/* Fourth pass. Blunt fragments of the kind people type into a chat box, more
   misspellings, and the phrasings that only turn up when you sit and imagine
   a real queue of customers. */
var FOURTH = {
  hours: ['hours', 'opening hours', 'time you close', 'when open', 'are u open rn', 'houres', 'what time you close on saturday'],
  location: ['address', 'location', 'directions', 'wher are you', 'adress please', 'your address'],
  pricing: ['prices', 'cost per load', 'how much for one load', 'price for a small washer', 'costs'],
  dryer: ['dryers', 'dryer', 'drying cost', 'how much per dryer load'],
  payment: ['do you take card', 'payment', 'quarters', 'credit card'],
  parking: ['parking spaces', 'do you have a car park'],
  amenities: ['wifi', 'wi fi password', 'bathroom', 'restrooms', 'seating'],
  'wash-fold': ['wash and fold', 'drop off laundry', 'wash dry fold', 'full service laundry'],
  turnaround: ['turnaround time', 'how long for drop off'],
  'per-pound': ['per pound', 'cost per pound', 'minimum'],
  detergent: ['detergent', 'soap for the washer', 'i want my clothes to smell nice'],
  stains: ['stain removal', 'stains', 'can you remove stains'],
  delicates: ['delicates', 'hand wash items', 'woolens'],
  bedding: ['comforters', 'blankets', 'duvets'],
  'dry-clean': ['dry cleaning'],
  attendant: ['attendant', 'is anyone there', 'staff on site'],
  'broken-machine': ['machine broken', 'out of order', 'my money got eaten'],
  'lost-found': ['lost and found', 'i lost something'],
  contact: ['phone', 'email'],
  jobs: ['jobs', 'hiring'],
  booking: ['do i need a booking', 'appointment needed'],
  'machine-sizes': ['machine sizes', 'washer sizes', 'do you have big washers'],
  'machine-howto': ['how to use the machines', 'instructions for the washer'],
  busy: ['busy times', 'quiet times'],
  'how-many-machines': ['number of machines', 'how many machines are free'],
  bleach: ['bleach'],
  pods: ['detergent pods', 'laundry pods'],
  'water-temp': ['water temperature', 'hot or cold water'],
  sorting: ['sorting laundry', 'separating colours'],
  whites: ['whitening', 'dull whites'],
  odor: ['smelly clothes', 'musty smell'],
  lint: ['lint', 'lint trap'],
  'static-shrink': ['static cling', 'shrinking clothes'],
  ironing: ['ironing', 'wrinkles'],
  'care-labels': ['care labels', 'washing symbols'],
  'how-often': ['how often to wash sheets'],
  'hard-water': ['hard water'],
  eco: ['eco friendly'],
  cleanliness: ['is it clean in there'],
  kids: ['kids allowed'],
  'pets-in-store': ['dogs allowed'],
  smoking: ['smoking allowed'],
  'food-drink': ['can i eat in there'],
  vending: ['vending machine', 'do you sell detergent for the machines'],
  lockers: ['lockers'],
  tipping: ['tipping'],
  discounts: ['discounts', 'student discounts'],
  'gift-receipt': ['gift cards', 'receipts'],
  atm: ['atm'],
  'change-machine': ['change machine'],
  language: ['spanish speaking staff'],
  accessibility: ['wheelchair access', 'disabled access'],
  transit: ['bus stop'],
  carts: ['laundry carts'],
  'other-locations': ['other branches'],
  'about-us': ['about the owner'],
  holidays: ['holiday opening'],
  'weather-closure': ['closed for snow'],
  'when-to-pay': ['when do i pay for drop off'],
  'track-order': ['order ready?'],
  'change-order': ['change my order'],
  'order-late': ['order late'],
  'separate-loads': ['washed separately'],
  'wash-fold-process': ['what settings do you wash on'],
  'ticket-id': ['claim ticket'],
  'fold-only': ['dry only service'],
  'what-to-bring': ['what to bring'],
  'sell-bags': ['do you sell laundry bags'],
  hangers: ['hang drying'],
  'bulk-business': ['commercial accounts'],
  delivery: ['delivery service'],
  alterations: ['clothing repairs'],
  'wash-cycle-time': ['wash cycle time'],
  overloading: ['overloading the washer'],
  'time-limit': ['time limit on machines'],
  unattended: ['leaving laundry unattended'],
  etiquette: ['laundromat etiquette'],
  down: ['down comforters'],
  'shoes-rugs': ['washing shoes', 'washing rugs'],
  'backpack-gear': ['washing a backpack'],
  uniforms: ['work uniforms'],
  diapers: ['cloth nappies'],
  'baby-clothes': ['washing baby clothes'],
  leather: ['leather jackets'],
  athletic: ['gym clothes'],
  'jeans-denim': ['washing jeans'],
  towels: ['washing towels'],
  'pet-laundry': ['pet blankets'],
  bedbugs: ['bed bugs'],
  'too-many-suds': ['too many suds'],
  'vinegar-soda': ['vinegar in laundry'],
  'dye-transfer': ['colour run'],
  'sweat-stains': ['sweat stains'],
  'gum-wax': ['gum on clothes'],
  mold: ['mould on clothes'],
  damage: ['damaged clothing'],
  human: ['speak to a manager'],
  notifications: ['text when ready'],
  reviews: ['leave a review'],
  website: ['your website'],
  capabilities: ['what can you help with'],
  greeting: ['hiya'],
  thanks: ['thank you so much'],
  bye: ['bye bye', 'thats everything thanks'],
  age: ['age limit'],
  rush: ['rush service'],
  'self-service': ['self service laundry'],
  'still-wet': ['clothes still wet']
};

Object.keys(FOURTH).forEach(function (id) {
  CASES[id] = (CASES[id] || []).concat(FOURTH[id]);
});

/* Fifth pass: sixty questions written after the four passes above were all
   passing, as a check that the matcher had not simply been fitted to the
   questions already in this file. Twelve of them fell through on the first
   run and are kept here so they stay fixed. */
var FIFTH = {
  alterations: [
    'my zipper broke can you fix it'
  ],
  amenities: [
    'do you have free wifi for customers',
    'is there anywhere to sit and work'
  ],
  attendant: [
    'is there someone who can help me lift my basket',
    'is the attendant there in the morning'
  ],
  'backpack-gear': [
  ],
  bedding: [
    'my dog rolled in something can i wash his bed'
  ],
  booking: [
    'do you take walk ins'
  ],
  'broken-machine': [
    'what happens if a machine breaks mid wash'
  ],
  busy: [
    'are you busy right now',
    'is there a queue on saturdays'
  ],
  carts: [
    'do you have carts to move laundry'
  ],
  'change-machine': [
    'do you have change for a fifty'
  ],
  damage: [
    'my clothes came back smelling different'
  ],
  delicates: [
    'do the washers have a delicate setting'
  ],
  detergent: [
    'how do i know how much soap to use',
    'how much soap for a large washer',
    'is your detergent scent free'
  ],
  down: [
    'can i wash my winter coat'
  ],
  'dry-clean': [
    'can i wash a suit jacket',
  ],
  dryer: [
    'are the dryers gas or electric'
  ],
  'fold-only': [
    'can i use the folding tables if i washed at home'
  ],
  hangers: [
    'can i bring my own hangers'
  ],
  hours: [
    'how long before you shut do i need to arrive'
  ],
  'how-many-machines': [
    'how many dryers do you have'
  ],
  kids: [
    'can kids use the machines'
  ],
  'lost-found': [
    'do you have a lost property box'
  ],
  'machine-sizes': [
    'whats the deal with the big machines',
    'whats the biggest thing you can wash',
    'can i put my duvet in the big machine'
  ],
  odor: [
    'can you get rid of cigarette smell',
    'my sheets smell like mildew after the wash'
  ],
  'other-locations': [
    'is there a laundromat closer to me'
  ],
  payment: [
    'are the machines coin operated',
    'can i pay for someone elses laundry'
  ],
  'per-pound': [
    'i have three bags of laundry is that ok',
    'whats the minimum for drop off'
  ],
  pricing: [
    'is it cheaper to do a big load or two small ones',
    'do you have prices on the website'
  ],
  'shoes-rugs': [
    'do you wash rugs'
  ],
  sorting: [
    'do you separate whites and colours for me'
  ],
  'static-shrink': [
    'how do i get rid of static'
  ],
  'time-limit': [
    'what happens if i forget my clothes',
    'can i leave my basket while i grab lunch',
    'is there a fee if im late collecting'
  ],
  tipping: [
    'do i tip for wash and fold'
  ],
  towels: [
    'whats the best cycle for towels'
  ],
  turnaround: [
    'do you do same day service',
    'can i get my order back tonight',
  ],
  unattended: [
    'do i have to stay while my clothes wash',
  ],
  'wash-fold': [
    'my kid spilled juice on the sofa cover can you wash it',
    'can i drop off and come back tomorrow'
  ],
  'wash-fold-process': [
    'do you sort my clothes for me'
  ],
  'what-to-bring': [
    'do i need to bring my own bag for drop off'
  ],
  'when-to-pay': [
    'do you accept apple pay at the counter'
  ],
  whites: [
    'my whites went yellow in storage'
  ]
};

Object.keys(FIFTH).forEach(function (id) {
  CASES[id] = (CASES[id] || []).concat(FIFTH[id]);
});

/* Sixth pass. Questions the earlier passes filed under the nearest topic
   that existed at the time. Each of these now has an answer of its own, and
   the more specific answer is the better one. */
var MOVED = {
  'trip-time': [
    'how long does the whole thing take start to finish'
  ],
  'formalwear': [
    'can you do my wedding dress',
    'can i wash a graduation gown',
    'can you handle a wedding dress'
  ],
  'cycle-options': [
    'which cycle should i choose',
    'is there a sanitize cycle'
  ],
  'refunds': [
    'can i get a refund',
    'i want my money back the machine broke',
    'i lost money in the machine'
  ],
  'door-stuck': [
    'the door wont open'
  ],
  'security': [
    'do you have security cameras',
    'is it safe at night',
    'is the parking lot well lit',
    'is the store secure',
    'are there cameras',
    'is it safe to come at 9pm'
  ],
  'theft': [
    'has anything ever been stolen',
    'do people steal clothes there'
  ],
  'curtains': [
    'can i wash curtains',
    'are curtains ok in your washers'
  ],
  'pillows': [
    'can i wash pillows'
  ],
  'car-seat': [
    'can i wash a car seat cover'
  ],
  'soiled-items': [
    'blood on my jeans'
  ],
  'work-study': [
    'can i work on my laptop while i wait'
  ],
  'not-helpful': [
    'this bot is useless'
  ],
  joke: [
    'tell me a joke',
    'can you write me a poem'
  ]
};

Object.keys(MOVED).forEach(function (id) {
  CASES[id] = (CASES[id] || []).concat(MOVED[id]);
});

/* Seventh pass. Every topic added in the second round of work, each asked the
   way the earlier passes ask: full sentences, fragments, complaints, and the
   phrasings that sit next to a topic that already existed. */
var SEVENTH = {
  climate: [
    'is there air conditioning',
    'do you have ac',
    'is the store air conditioned',
    'does it get hot in there in the summer',
    'is it heated in winter',
    'is there heating',
    'is it freezing in there in january',
    'do you have fans',
    'is it stuffy in there',
    'aircon?'
  ],
  security: [
    'is it safe there',
    'is that a safe neighborhood',
    'is it safe to come at 10pm',
    'do you have cameras',
    'is there cctv',
    'is the lot well lit',
    'is the area sketchy',
    'is the store secure',
    'any security'
  ],
  community: [
    'can i put a flyer on your board',
    'do you have a notice board',
    'do you take clothing donations',
    'is there a donation bin',
    'would you sponsor our team',
    'can i advertise in your store',
    'we are running a fundraiser',
    'i have bags of unwanted clothes to give away'
  ],
  refunds: [
    'whats your refund policy',
    'do you do refunds',
    'can i get my money back',
    'i was charged twice',
    'my card got charged twice for one wash',
    'i put in too much money',
    'i paid too much',
    'can i get store credit',
    'i want compensation'
  ],
  'card-trouble': [
    'my card was declined',
    'the card reader isnt working',
    'the card reader is broken',
    'it wont take my card',
    'the machine wouldnt take my card',
    'payment failed at the washer',
    'card declined at the dryer',
    'the chip reader is not reading'
  ],
  tax: [
    'is tax included',
    'do you charge sales tax',
    'is the price with tax',
    'is there tax on top',
    'are the prices before tax'
  ],
  'price-changes': [
    'have your prices gone up',
    'did the price change',
    'you put your prices up',
    'it used to cost less',
    'did you raise your prices',
    'this is more than last time'
  ],
  packaging: [
    'how does my laundry come back',
    'do you bag it',
    'is it in a plastic bag',
    'do you pair socks',
    'do you match socks',
    'how is it folded',
    'can you pack it in my own basket',
    'does it come back wrapped'
  ],
  pockets: [
    'do you check pockets',
    'do you empty pockets',
    'what if i leave money in my pocket',
    'a pen went through the wash',
    'a tissue went through the wash',
    'what happens if theres a pen in the pocket',
    'i left a receipt in a pocket'
  ],
  'machine-brand': [
    'what brand are your machines',
    'what make are the washers',
    'are they speed queen',
    'do you use maytag',
    'how old are the machines',
    'who services your machines',
    'do you sell your old machines',
    'are these commercial machines'
  ],
  'cycle-options': [
    'what does permanent press do',
    'should i use heavy duty',
    'whats the difference between the cycles',
    'is there a delicate cycle',
    'can i add an extra rinse',
    'should i use prewash',
    'what spin speed should i use',
    'what do the cycles mean'
  ],
  'trip-time': [
    'how much time should i set aside',
    'how long will i be there',
    'how long does the whole trip take',
    'how long should i plan for',
    'am i in and out in an hour'
  ],
  'cycle-done': [
    'how do i know when its done',
    'does the machine beep',
    'is there a timer',
    'how do i see the time left',
    'does it show minutes left',
    'is there a countdown'
  ],
  'door-stuck': [
    'the washer door is locked',
    'my clothes are locked in the machine',
    'i cant open the door',
    'how do i stop the machine',
    'can i cancel the cycle',
    'can i pause it and add a shirt',
    'i forgot to add something can i open it'
  ],
  'wrong-machine': [
    'i put my clothes in the wrong machine',
    'i paid for the wrong washer',
    'i started the wrong dryer',
    'i loaded the wrong one',
    'i paid on the wrong machine'
  ],
  'spill-leak': [
    'theres water all over the floor',
    'the washer is leaking',
    'a machine is flooding',
    'i spilled detergent everywhere',
    'i dropped my detergent',
    'the floor is wet and slippery',
    'i made a mess'
  ],
  'heat-damage': [
    'my shirt melted in the dryer',
    'the dryer burned my clothes',
    'the print cracked in the dryer',
    'my logo peeled off',
    'the elastic went after drying',
    'my top came out scorched'
  ],
  'oil-flammable': [
    'can i wash oily rags',
    'can i wash shop rags',
    'my clothes have motor oil on them',
    'i got gasoline on my jeans',
    'can i wash clothes with petrol on them',
    'my overalls are soaked in oil',
    'is it ok to dry rags with paint thinner on them',
    'diesel went on my coveralls'
  ],
  'soiled-items': [
    'my kid had an accident on the sheets',
    'how do i wash vomit out',
    'my toddler is potty training',
    'i need to wash soiled bedding',
    'bed wetting sheets',
    'can i bring incontinence laundry',
    'someone was sick on the duvet'
  ],
  pillows: [
    'how do i wash a pillow',
    'can i wash cushions',
    'my memory foam pillow smells',
    'can i put throw pillows in the washer',
    'are pillows ok in your machines'
  ],
  curtains: [
    'can i wash my drapes',
    'can i wash a shower curtain',
    'are net curtains ok in the machine',
    'how do i clean blackout curtains',
    'do curtains shrink in the wash'
  ],
  'stuffed-toys': [
    'can i wash stuffed animals',
    'can i wash my kids teddy',
    'how do i clean a plush toy',
    'is it safe to wash soft toys',
    'my daughters teddy bear needs a wash'
  ],
  'car-seat': [
    'how do i clean a car seat',
    'can i wash the stroller cover',
    'is it safe to wash car seat straps',
    'can i put a high chair cover in the washer',
    'my carseat cover needs washing'
  ],
  formalwear: [
    'can you clean a wedding dress',
    'how do i wash a prom dress',
    'can i wash a costume',
    'can you clean a tuxedo',
    'a sequin dress needs cleaning',
    'i need a ball gown cleaned'
  ],
  hats: [
    'can i wash hats',
    'can i wash a baseball cap',
    'how do i clean a cap without ruining it',
    'can a beanie go in the washer',
    'will a hat lose its shape in the wash'
  ],
  swimwear: [
    'can i wash my swimsuit',
    'how do i get chlorine out',
    'can a bikini go in the dryer',
    'my swim shorts smell of the pool',
    'how do i wash a wetsuit',
    'can a bathing suit go in the machine'
  ],
  'table-linens': [
    'how do i wash a tablecloth',
    'can i wash napkins',
    'do you wash table linen',
    'can i wash tea towels',
    'how do i clean an apron',
    'are placemats ok in the washer'
  ],
  'reusable-bags': [
    'can i wash reusable grocery bags',
    'how do i clean a tote bag',
    'can i wash a canvas bag',
    'is it ok to wash a lunch bag',
    'can i wash an insulated cooler bag'
  ],
  heirloom: [
    'my grandmother made this quilt how do i wash it',
    'i have a vintage dress to wash',
    'this is an heirloom can you be careful',
    'how do i wash old lace',
    'a christening gown needs cleaning',
    'antique linen needs cleaning'
  ],
  trash: [
    'where do i put my trash',
    'where does the rubbish go',
    'can i throw this away here',
    'do you recycle',
    'where do i put my empty detergent bottle',
    'is there a garbage can'
  ],
  'work-study': [
    'can i work on my laptop there',
    'is it quiet enough to take a call',
    'can i do homework while i wait',
    'how loud is it in there',
    'could i take a zoom call',
    'is it noisy in there',
    'can i get some work done while i wait'
  ],
  'machine-hygiene': [
    'are the machines cleaned between customers',
    'do you wipe the drums',
    'who used the machine before me',
    'im immunocompromised is it safe to use',
    'can i catch something from a shared washer',
    'should i run an empty cycle first'
  ],
  theft: [
    'someone stole my clothes',
    'my laundry was taken',
    'i think someone went through my bag',
    'my bag is gone',
    'has anyone had things stolen'
  ],
  'not-helpful': [
    'you are not helping',
    'thats not what i asked',
    'you dont understand me',
    'this is stupid',
    'wrong answer',
    'you keep saying the same thing',
    'that makes no sense'
  ],
  'small-talk': [
    'how are you',
    'hows it going',
    'how are you doing today',
    'hows your day going',
    'whats up'
  ],
  joke: [
    'say something funny',
    'make me laugh',
    'can you sing',
    'do you know any riddles',
    'im bored entertain me'
  ]
};

Object.keys(SEVENTH).forEach(function (id) {
  CASES[id] = (CASES[id] || []).concat(SEVENTH[id]);
});

/* Eighth pass. Nothing new here, just more ways to ask what the bot already
   knew, written to walk into the topics the seventh pass just added. */
var EIGHTH = {
  hours: [
    'are you open at 9pm',
    'is it too late to come now',
    'do you shut at 10'
  ],
  pricing: [
    'what does a wash run me',
    'roughly what will a load cost'
  ],
  payment: [
    'is there a card reader on every machine',
    'do i need cash'
  ],
  dryer: [
    'how much for the dryers',
    'whats the dryer cost per cycle'
  ],
  'broken-machine': [
    'this washer is out of order',
    'the machine is making a grinding noise',
    'the dryer is shaking badly',
    'the washer wont fill with water'
  ],
  unattended: [
    'do i have to stay while it washes',
    'can i go home while it runs',
    'is it ok to leave my laundry running'
  ],
  etiquette: [
    'someone took my clothes out of the dryer',
    'all the machines are full what do i do'
  ],
  'lost-found': [
    'i left my jacket there yesterday',
    'did anyone find a phone'
  ],
  damage: [
    'my shirt came back with a hole',
    'something is missing from my order'
  ],
  detergent: [
    'do you use fabric softener',
    'can i use scent free soap',
    'i have sensitive skin what do you use'
  ],
  'wash-fold-process': [
    'can i ask you to wash it all on cold',
    'can i leave instructions with my bag'
  ],
  bedding: [
    'will a king duvet fit',
    'can i do all my bedding in one go'
  ],
  delicates: [
    'whats the gentlest way to wash a bra',
    'my cashmere needs washing'
  ],
  stains: [
    'how do i get red wine out',
    'theres ketchup on my shirt'
  ],
  ironing: [
    'do you press shirts',
    'everything comes out wrinkled'
  ],
  attendant: [
    'is anyone there to help me',
    'ive never used a laundromat before'
  ],
  amenities: [
    'do you have wifi',
    'is there anywhere to sit'
  ],
  'food-drink': [
    'can i bring a coffee in',
    'is eating allowed'
  ],
  turnaround: [
    'if i drop off this morning when is it ready',
    'is drop off ready the same day'
  ],
  capabilities: [
    'what can you help me with',
    'are you a real person'
  ],
  location: [
    'what is your address',
    'how far are you from downtown'
  ],
  parking: [
    'is there parking out front',
    'can i pull up to the door'
  ]
};

Object.keys(EIGHTH).forEach(function (id) {
  CASES[id] = (CASES[id] || []).concat(EIGHTH[id]);
});

/* Ninth pass. Written after the eighth was green and run once before anything
   was changed, so it is a held-out set rather than more of what already
   passed. A third of it failed on that first run: the words people reach for
   when they are annoyed ("walked off with my washing", "you are not answering
   my question"), British spellings, and every way of saying a machine has
   your money that is not "took". Those fixes are the reason it is kept. */
var NINTH = {
  climate: [
    'does the laundromat have air con',
    'is it warm inside in the winter'
  ],
  security: [
    'are there cameras watching the machines',
    'i am nervous about coming after dark',
    'is your car park lit up'
  ],
  community: [
    'could i pin a lost cat poster up',
    'we collect coats for the shelter can we leave a box'
  ],
  refunds: [
    'i want my money returned',
    'my bank shows two charges'
  ],
  'broken-machine': [
    'the washer ate two dollars',
    'this is the third time a machine has taken my money'
  ],
  'card-trouble': [
    'the reader keeps saying declined'
  ],
  tax: [
    'do i pay tax on top of that'
  ],
  packaging: [
    'do you fold the socks together',
    'is my laundry returned in a sack'
  ],
  pockets: [
    'do you look in pockets before washing',
    'a biro went through with my shirts'
  ],
  'machine-brand': [
    'what washers do you run',
    'when were the machines put in'
  ],
  'cycle-options': [
    'what does the heavy duty setting do',
    'is there a rinse and spin only option'
  ],
  'cycle-done': [
    'does a machine tell me when it has finished'
  ],
  'door-stuck': [
    'i cannot get the washer open',
    'my washing is trapped',
    'i want to stop it early',
    'HELP MY CLOTHES ARE STUCK'
  ],
  'wrong-machine': [
    'i loaded the machine next to mine by mistake'
  ],
  'spill-leak': [
    'the floor near the dryers is soaked',
    'a washer is dripping water everywhere',
    'emergency i spilled bleach on the floor'
  ],
  'heat-damage': [
    'my sweatshirt print has gone crusty',
    'the dryer cooked my leggings'
  ],
  'oil-flammable': [
    'is petrol on clothing a problem'
  ],
  'soiled-items': [
    'my son wet the bed how do i wash the sheets',
    'the cat was sick on a blanket'
  ],
  pillows: [
    'can pillows go in the big washer'
  ],
  curtains: [
    'are my curtains going to shrink'
  ],
  'stuffed-toys': [
    'how do you clean a childs teddy'
  ],
  'car-seat': [
    'can i clean the pushchair fabric'
  ],
  formalwear: [
    'my bridesmaid dress needs cleaning'
  ],
  hats: [
    'do caps survive the washing machine'
  ],
  swimwear: [
    'how do i stop my swimsuit going baggy'
  ],
  'table-linens': [
    'do napkins need a hot wash'
  ],
  'reusable-bags': [
    'can i machine wash a canvas tote'
  ],
  heirloom: [
    'my mums old lace needs washing'
  ],
  trash: [
    'where can i chuck an empty bottle'
  ],
  theft: [
    'someone has walked off with my washing'
  ],
  'not-helpful': [
    'you are not answering my question'
  ],
  human: [
    'i am never coming back',
    'i want to speak to the owner about the state of the place'
  ],
  'order-late': [
    'i have been waiting an hour for my order'
  ],
  rush: [
    'i need this back in two hours',
    'URGENT need laundry done today'
  ],
  payment: [
    'do you know if you take amex',
    'do you take bitcoin',
    'do i need quarters or will a card do'
  ],
  language: [
    'do any of the staff speak french'
  ],
  amenities: [
    'my phone died can i charge it',
    'is it a quiet place to sit with a laptop'
  ],
  'self-service': [
    'my machine at home broke can i use yours'
  ],
  jobs: [
    'are you taking on anyone at the moment'
  ],
  capabilities: [
    'what sort of things can i ask you'
  ],
  turnaround: [
    'if i drop a bag off at 8am when do i get it',
    'roughly how long am i stuck there'
  ],
  hours: [
    'till what time are you open',
    'you shut at ten right',
    'i was wondering whether you might be open late on a friday'
  ],
  'small-talk': [
    'hey how are you today'
  ],
  joke: [
    'know any good jokes'
  ]
};

Object.keys(NINTH).forEach(function (id) {
  CASES[id] = (CASES[id] || []).concat(NINTH[id]);
});

/* Tenth pass, also held out. This one went hunting in the corners the earlier
   passes never visited: care symbols, hard water, trolleys, who can collect an
   order, and the questions about the bot itself that only have an honest
   answer ("do you remember me"). */
var TENTH = {
  'hard-water': [
    'our water is really hard does that matter',
    'theres limescale in my washing machine at home'
  ],
  'care-labels': [
    'the label has a triangle with a cross through it'
  ],
  odor: [
    'how do i get rid of the smell of smoke'
  ],
  carts: [
    'do you have trolleys to move my washing'
  ],
  lockers: [
    'i want to leave my shopping while i wash'
  ],
  'machine-howto': [
    'which drawer for the powder'
  ],
  unattended: [
    'do i have to be there when it is washed'
  ],
  'time-limit': [
    'do you keep it if i am late collecting'
  ],
  'change-order': [
    'can my neighbour drop it off for me'
  ],
  'card-trouble': [
    'the card machine is playing up again'
  ],
  'broken-machine': [
    'a dryer door is hanging off'
  ],
  'machine-hygiene': [
    'i am worried about germs in the machines',
    'the machines look like they need a wipe'
  ],
  capabilities: [
    'who wrote you',
    'are you a person or a computer'
  ],
  memory: [
    'do you remember me',
    'can you remember what i asked before',
    'do you remember what i said earlier',
    'what did i just ask you',
    'do you keep a record of our chat'
  ],
  'not-helpful': [
    'you told me the wrong price'
  ],
  'self-service': [
    'my machine at home broke can i use yours',
    'i dont have a washing machine at home'
  ],
  jobs: [
    'do you have a job for my son who is 12'
  ],
  'dye-transfer': [
    'my new jeans turned everything blue'
  ],
  accessibility: [
    'my mum uses a walker will she manage',
    'i cant lift the basket out of the car'
  ],
  age: [
    'can my 14 year old use the machines alone'
  ],
  eco: [
    'how much water does a load use'
  ],
  whites: [
    'how do i brighten whites without bleach'
  ],
  mold: [
    'theres mould in the door seal'
  ],
  climate: [
    'the store was boiling yesterday'
  ],
  trash: [
    'nobody empties the bins'
  ],
  'heat-damage': [
    'the printed logo on my hoodie is peeling'
  ],
  'oil-flammable': [
    'gasoline on my work trousers'
  ],
  'soiled-items': [
    'my dog was sick on the rug'
  ],
  pillows: [
    'i want to wash the pillows off my sofa'
  ],
  curtains: [
    'the shower curtain has mildew on it'
  ],
  'stuffed-toys': [
    'my kids toys need cleaning'
  ],
  'car-seat': [
    'the baby seat cover is filthy'
  ],
  formalwear: [
    'my costume for the party needs a wash'
  ],
  hats: [
    'my hat got sweaty'
  ],
  swimwear: [
    'my swim things smell of chlorine'
  ],
  'table-linens': [
    'the tablecloth from christmas needs washing'
  ],
  'reusable-bags': [
    'my shopping bags are gross'
  ],
  heirloom: [
    'this quilt was my grandmothers'
  ],
  'per-pound': [
    'do you weigh it in front of me'
  ],
  overloading: [
    'how full should i fill the drum'
  ]
};

Object.keys(TENTH).forEach(function (id) {
  CASES[id] = (CASES[id] || []).concat(TENTH[id]);
});

/* Eleventh pass, held out like the two before it. Three shapes this time: the
   two-word fragment people actually type into a chat box, the same words with
   a letter wrong, and the question wearing a greeting on the front, which used
   to be answered with "Hello" and nothing else. */
var ELEVENTH = {
  climate: ['aircon', 'air conditionning'],
  security: ['cameras', 'do you have camaras'],
  refunds: ['refund policy', 'whats your refund polciy'],
  'card-trouble': ['card declined', 'my crad was declined'],
  tax: ['sales tax'],
  packaging: ['do you pair scoks'],
  pockets: ['pockets'],
  'machine-brand': ['speed queen'],
  'cycle-options': ['permanent press', 'extra rinse', 'permanant press'],
  'door-stuck': ['door stuck', 'the dor wont open'],
  'wrong-machine': ['wrong washer'],
  'spill-leak': ['leaking'],
  'heat-damage': ['melted', 'my clothes meltd'],
  'oil-flammable': ['oily rags'],
  'soiled-items': ['vomit'],
  pillows: ['pillow', 'can i wash pilows'],
  curtains: ['curtains', 'can i wash curtans'],
  'stuffed-toys': ['teddy', 'stuffed animls'],
  'car-seat': ['car seat'],
  formalwear: ['wedding dress'],
  hats: ['baseball cap'],
  swimwear: ['swimsuit', 'swimsuti'],
  'table-linens': ['tablecloth', 'tabelcloth'],
  'reusable-bags': ['tote bag'],
  heirloom: ['antique quilt'],
  trash: ['bins'],
  'work-study': ['homework'],
  'machine-hygiene': ['germs', 'immunocompromized'],
  theft: ['stolen'],
  'not-helpful': ['you are useless'],
  'small-talk': ['how are you'],
  /* A question with a hello on the front is still that question. */
  bedding: ['good morning i wanted to ask whether you would be able to wash a duvet for me'],
  pricing: ['hello there, i was hoping you could tell me how much a large load costs'],
  payment: ['sorry, one last thing, do you take card payments at the counter', 'i dont have any quarters'],
  'wash-fold': ['excuse me, would it be possible to leave my laundry with you until the evening'],
  thanks: ['thanks that helped a lot'],
  /* Said as what someone does not want. */
  hangers: ['i dont want my clothes tumble dried', 'i would rather not use a dryer'],
  hours: ['i cant come during the week', 'is 9pm too late to start a load'],
  'how-many-machines': ['can i do 5 loads at once'],
  'self-service': ['which is better wash and fold or self service'],
  tipping: ['should i tip the attendant'],
  'machine-sizes': ['is it worth using the big washer'],
  'per-pound': ['how much is 20 pounds of laundry']
};

Object.keys(ELEVENTH).forEach(function (id) {
  CASES[id] = (CASES[id] || []).concat(ELEVENTH[id]);
});

/* Twelfth pass, held out. Aimed at the things that go wrong in a store rather
   than to a garment: the wifi, the bathroom, a burning smell, someone asleep
   in the corner, and every version of "who do I tell about this". */
var TWELFTH = {
  delicates: ['is it safe to wash a wool coat'],
  reviews: ['do you have a suggestion box'],
  'broken-machine': ['a machine is making a burning smell', 'the wifi is not working'],
  athletic: ['my sons football kit is caked in mud'],
  ironing: ['do you do ironing as a separate service'],
  parking: ['can i leave a car in your lot overnight'],
  'wash-fold-process': ['can i put a note on the bag'],
  'weather-closure': ['what if it rains and i cant get there'],
  'about-us': ['is the store closing down'],
  human: ['how do i report a problem with the store', 'do you have a complaints procedure'],
  damage: ['are you insured', 'what happens if a machine damages my clothes'],
  leather: ['can i wash motorcycle gear'],
  down: ['my ski jacket needs cleaning'],
  pods: ['is powder better than liquid'],
  'jeans-denim': ['how do i keep black clothes black'],
  lint: ['my black clothes are covered in lint'],
  'bulk-business': ['i need to wash 60 towels for a gym'],
  'shoes-rugs': ['can i wash a mop head'],
  bleach: ['the last person left bleach in the drum'],
  detergent: ['how much soap for a small load', 'i think my detergent is causing a rash'],
  'static-shrink': ['do dryer balls work', 'can i use my own dryer sheets'],
  towels: ['why do towels take so long to dry'],
  amenities: ['the bathroom is out of paper'],
  'track-order': ['my ticket number is 47 is it ready'],
  'lost-found': ['what happens to clothes left behind'],
  'change-machine': ['is the change machine working today'],
  attendant: ['i feel unwell can someone help'],
  bedding: ['can i wash a weighted blanket here', 'what size machine for two duvets']
};

Object.keys(TWELFTH).forEach(function (id) {
  CASES[id] = (CASES[id] || []).concat(TWELFTH[id]);
});

/* Thirteenth pass: the app on the self-service side and the Comfort Club on
   the drop-off side. Both answers are placeholders, but the matching is not,
   and these two topics are unusually easy to confuse because a member and an
   app user are both "signed up for something". The crossover questions at the
   end of each group are the ones that matter: an answer about the wrong
   service is the failure mode here, not a fallback. */
var THIRTEENTH = {
  app: [
    'do you have an app',
    'is there an app',
    'is there an app to download',
    'is there an app i have to use',
    'whats the app called',
    'where do i download the app',
    'is the app on android',
    'is it on the app store',
    'can i see which machines are free from home',
    'can i start a machine from my phone',
    'can i check the machines online',
    'does the app do remote start',
    'do i need the app to use the machines',
    'is the app free',
    'app'
  ],
  'app-trouble': [
    'the app is not working',
    'the app crashed',
    'i cant log in to the app',
    'i forgot my password for the app',
    'the app says a machine is free but it isnt',
    'the app wont start the machine',
    'the app charged me twice',
    'the app is stuck on loading'
  ],
  'comfort-club': [
    'what is the comfort club',
    'tell me about the comfort club',
    'how much is the comfort club',
    'how do i join the comfort club',
    'is there a membership plan',
    'do you have a loyalty program',
    'do you have a rewards program',
    'do you do a punch card',
    'is there a members rate',
    'do members get a discount',
    'is it worth joining',
    'is there a monthly plan',
    'comfort club'
  ],
  'club-manage': [
    'how do i cancel my membership',
    'i want to cancel the club',
    'can i pause my membership',
    'can i freeze my membership for a month',
    'how do i change my plan',
    'i want to stop my subscription',
    'can i get a refund on my membership'
  ],
  /* Neither feature covers both services, so these have to land on the right
     side of the store. */
  membership: [
    'do i need an account',
    'do i have to sign up for anything',
    'is any of it members only',
    'do i have to be a member to use the machines'
  ]
};

Object.keys(THIRTEENTH).forEach(function (id) {
  CASES[id] = (CASES[id] || []).concat(THIRTEENTH[id]);
});

/* Fourteenth pass, held out. The crossover between the two features, which is
   where they break rather than at the obvious questions: the app belongs to
   self-service and the club to drop-off, so an answer about the wrong service
   is the failure to watch for. Also the people who will not use an app at all,
   who still need to be told they do not have to. */
var FOURTEENTH = {
  app: [
    'do i need the app for drop off',
    'can i use the app for wash and fold',
    'can i see if a washer is free before i drive over',
    'can i pay in the app',
    'can i reserve a machine on the app',
    'do i have to use the app now',
    'my mum doesnt have a smartphone',
    'is there a website instead of the app'
  ],
  'comfort-club': [
    'does the comfort club cover self service',
    'is the club any use if i wash my own',
    'tell me about your membership',
    'do i save money with the club',
    'can i join the club today',
    'can i pay for the club at the counter',
    'is the club worth it if i come once a month',
    'do i get free pickup as a member'
  ],
  'app-trouble': [
    'the app logged me out',
    'the app wont let me pay',
    'i was charged by the app for a machine i didnt use',
    'the app shows all machines busy but the store is empty'
  ],
  membership: [
    'is the app part of the comfort club',
    'do club members get the app'
  ],
  'cycle-done': [
    'how do i know when my load is done'
  ],
  'track-order': [
    'when is my order done'
  ],
  'how-many-machines': [
    'is a washer free right now'
  ]
};

Object.keys(FOURTEENTH).forEach(function (id) {
  CASES[id] = (CASES[id] || []).concat(FOURTEENTH[id]);
});

/* Two questions in one message. Both answers have to come back, in this order.
   Everything else in this file must come back as a single topic, which is the
   real test here: bundling only when the question was genuinely bundled. */
var BUNDLED = [
  ['what are your hours and where are you', 'hours + location'],
  ['do you have wifi and parking', 'amenities + parking'],
  ['what are your prices and how long does wash dry and fold take', 'pricing + turnaround'],
  ['are you open on sunday and do you take cards', 'hours + payment'],
  ['do you have parking and is there an attendant', 'parking + attendant'],
  ['whats your address and phone number', 'location + contact'],
  ['can i bring my dog and do you have wifi', 'pets-in-store + amenities'],
  ['how much is a wash and do you sell detergent', 'pricing + vending']
];

/* A question split over two messages. The second on its own says nothing, so
   it is read together with the last question that got an answer. */
var FOLLOW_UPS = [
  ['what are your hours', 'what about on sundays', 'hours'],
  ['what are your prices', 'is that per load', 'pricing'],
  ['do you do wash dry and fold', 'how long does it take', 'turnaround'],
  ['can i wash a comforter', 'what about a duvet', 'bedding'],
  ['do you have parking', 'is it free', 'parking'],
  ['are you open today', 'and tomorrow', 'hours']
];

/* Must NOT be answered. Better a clear "ask the attendant" than a confident
   answer to a question this bot was never given the facts for. */
var FALLBACK_CASES = [
  'whats the weather like',
  'who won the game last night',
  'what is the capital of france',
  'whats 2 plus 2',
  'do you sell furniture',
  'can you fix my dishwasher',
  'asdfgh',
  'qwertyuiop',
  'can you fix my car',
  'i need a haircut',
  'book me a hotel',
  'how do i get to the airport',
  'whats your favourite colour',
  'do you sell washing machines',
  'what is the meaning of life',
  'how do i change a tyre',
  'recommend a restaurant',
  'do you do grooming for dogs',
  'my phone battery died',
  'do you fix phones',
  'where is the nearest hospital',
  'my computer needs repairing',
  'can you check my bank balance',
  'what should i have for dinner',
  'how do i unclog a drain',
  'can you call me a doctor',
  'my landlord wont fix my washer',
  'what is a good washing machine to buy',
  'can you recommend a laundromat in chicago',
  'do you know how to remove a tattoo',
  'can you order me an uber',
  'can you translate this into french'
];

/* ---------- Runner ---------- */

function topicFor(question) {
  var topics = soapzy.answerTopics(question);
  return topics.length ? topics.join(' + ') : 'FALLBACK';
}

var failures = [];
var total = 0;

Object.keys(CASES).forEach(function (id) {
  CASES[id].forEach(function (question) {
    total++;
    var got = topicFor(question);
    if (got !== id) failures.push({ question: question, want: id, got: got });
  });
});

BUNDLED.forEach(function (pair) {
  total++;
  var got = topicFor(pair[0]);
  if (got !== pair[1]) failures.push({ question: pair[0], want: pair[1], got: got });
});

FOLLOW_UPS.forEach(function (turn) {
  total++;
  var topics = soapzy.answerTopics(turn[1], turn[0]);
  var got = topics.length ? topics.join(' + ') : 'FALLBACK';
  if (got !== turn[2]) {
    failures.push({ question: turn[0] + '" then "' + turn[1], want: turn[2], got: got });
  }
});

FALLBACK_CASES.forEach(function (question) {
  total++;
  var got = topicFor(question);
  if (got !== 'FALLBACK') failures.push({ question: question, want: 'FALLBACK', got: got });
});

/* Every topic in the answer list needs cases of its own, so a topic added
   later cannot quietly go untested. */
var untested = [];
for (i = 0; i < soapzy.ANSWERS.length; i++) {
  if (!CASES[soapzy.ANSWERS[i].id]) untested.push(soapzy.ANSWERS[i].id);
}

/* Two entries sharing an id would make the topic reported here ambiguous. */
var duplicates = [];
var seen = {};
for (i = 0; i < soapzy.ANSWERS.length; i++) {
  var id = soapzy.ANSWERS[i].id;
  if (seen[id]) duplicates.push(id);
  seen[id] = true;
}

/* Keywords in one entry that stem to the same thing are one keyword written
   twice. The matcher scores such a group once on purpose, so this is only a
   tidiness check on the lists, reported but not fatal. */
var doubleCounted = [];
for (i = 0; i < soapzy.ANSWERS.length; i++) {
  var entry = soapzy.ANSWERS[i];
  var stems = {};
  for (var k = 0; k < entry.keys.length; k++) {
    var normal = entry.keys[k].split(/[^a-z0-9]+/i).map(soapzy.stem).join(' ');
    if (stems[normal] === entry.keys[k]) {
      doubleCounted.push(entry.id + ': "' + entry.keys[k] + '" is listed twice');
    }
    stems[normal] = entry.keys[k];
  }
}

/* A property written twice in one entry silently discards the first copy, and
   an entry with two avoid lists lost one of them for a while without anything
   failing. The parsed objects cannot show it, so this reads the source. */
var repeatedFields = [];
var source = require('fs').readFileSync(__dirname + '/../assets/js/chat.js', 'utf8');
var body = source.slice(source.indexOf('var ANSWERS = ['), source.indexOf('\n  var FALLBACK'));
body.split(/\n    \{\n/).forEach(function (block) {
  var fields = {};
  var idLine = /id: '([^']+)'/.exec(block);
  (block.match(/^ {6}(id|keys|context|avoid|alone|text):/gm) || []).forEach(function (line) {
    var name = line.trim().replace(':', '');
    if (fields[name]) repeatedFields.push((idLine ? idLine[1] : '?') + ' has two "' + name + '" lines');
    fields[name] = true;
  });
});

if (failures.length) {
  console.log('\n' + failures.length + ' of ' + total + ' questions went to the wrong topic:\n');
  failures.forEach(function (f) {
    console.log('  "' + f.question + '"\n      want ' + f.want + ', got ' + f.got);
  });
  console.log('');
}
if (untested.length) console.log('Topics with no test cases: ' + untested.join(', ') + '\n');
if (duplicates.length) console.log('Duplicate topic ids: ' + duplicates.join(', ') + '\n');
if (doubleCounted.length) console.log('Repeated keywords:\n  ' + doubleCounted.join('\n  ') + '\n');
if (repeatedFields.length) console.log('Repeated fields:\n  ' + repeatedFields.join('\n  ') + '\n');

assert.strictEqual(duplicates.length, 0, 'duplicate topic ids');
assert.strictEqual(repeatedFields.length, 0, 'an entry must not set a field twice');
assert.strictEqual(doubleCounted.length, 0, 'a keyword must not be listed twice in one entry');
assert.strictEqual(untested.length, 0, 'every topic needs test cases');
assert.strictEqual(failures.length, 0, 'all questions must reach their topic');

console.log(total + ' questions, all matched their topic.');
