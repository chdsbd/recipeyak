from collections import defaultdict
from typing import Any, Dict, Mapping, Set

from core.schedule.inflect import singularize

DEPARTMENT_MAPPING = {
    "produce": {
        "basil",
        "coconut",
        "blueberries",
        "blackberries",
        "raspberries",
        "chile",
        "chili",
        "lemongrass",
        "eggplant",
        "cubanelle peppers",
        "plum",
        "apricots",
        "sage",
        "tarragon",
        "romaine",
        "habanero chile",
        "snow pea",
        "spring mix",
        "dates",
        "prunes",
        "corn",
        "tomatillos",
        "salad",
        "pico de gallo",
        "peas",
        "bean sprouts",
        "passion fruit",
        "mushroom",
        "herbs",
        "butternut squash",
        "pasilla chilies",
        "mulato chiles",
        "haricot verts",
        "haricots verts",
        "greens",
        "pomegranate",
        "edamame",
        "rhubarb",
        "zucchini",
        "watermelon",
        "brussel sprouts",
        "brussels sprouts",
        "brusel sprouts",
        "dill",
        "beets",
        "broccoli",
        "berries",
        "leeks",
        "ancho chiles",
        "chipotle chiles",
        "pequin chile",
        "cascabel chile",
        "arbor chile",
        "chile negro",
        "chile ancho",
        "cauliflower",
        "fennel",
        "cranberries",
        "scallion",
        "bok choy",
        "turnip",
        "red chili",
        "tofu",
        "potato",
        "pear",
        "strawberries",
        "strawberris",
        "strawberry",
        "grapefruit",
        "serrano chile",
        "thai chile",
        "green chillies",
        "green chiles",
        "carrot",
        "chive",
        "avocado",
        "watercress",
        "cabbage",
        "scallions",
        "lime",
        "thyme",
        "radish",
        "mushroom",
        "lemon",
        "tomato",
        "lettuce",
        "shallot",
        "rosemary",
        "apple",
        "banana",
        "kale",
        "cilantro",
        "asparagus",
        "spinach",
        "orange",
        "arugula",
        "jalapeno",
        "jalapeño",
        "bell pepper",
        "onion",
        "parsley",
        "parsely",
        "mint",
        "garlic",
        "ginger",
        "lemon",
        "clementine",
        "celery",
        "oregano",
        "cucumber",
    },
    "meat": {
        "chicken",
        "beef",
        "pepperoni",
        "pork",
        "bacon",
        "sausage",
        "salmon",
        "kielbasa",
        "merguez",
        "chuck-eye roast",
        "pancetta",
        "oxtails",
        "ham",
        "chuck roast",
        "round roast",
        "bratwurst",
        "steak",
        "prawns",
        "turkey",
        "veal",
        "sirloin",
        "chorizo",
        "short ribs",
        "shortribs",
        "lamb",
        "fish",
        "brisket",
    },
    "cheese": {
        "cheese",
        "cheddar",
        "colby jack",
        "provolone",
        "queso fresco",
        "parmigiano",
        "mascarpone",
        "fontina",
        "pecorino",
        "feta",
        "parmesan",
        "gruyère",
        "gruyere",
        "mozzarella",
    },
    "dairy": {
        "egg",
        "milk",
        "buttermilk",
        "cream",
        "ricotta",
        "yogurt",
        "yoghurt",
        "butter",
        "half-and-half",
        "creme",
        "creme fraiche",
        "crème fraîche",
    },
    "baking": {
        "sugar",
        "granulated",
        "flour",
        "chocolate",
        "choclate",
        "poppy seeds",
        "molasses",
        "lard",
        "ghee",
        "gee",
        "cocoa",
        "food coloring",
        "cocoa powder",
        "coca powder",
        "baking soda",
        "baking powder",
    },
    "frozen": {
        "bag potstickers",
        "potstickers",
        "phyllo dough",
        "phyllo pastry",
        "puff pastry",
        "pie dough",
        "pie crust",
        "pie shell",
    },
    "bread": {
        "bread",
        "panettone",
        "pita",
        "naan",
        "bun",
        "burger bun",
        "buns",
        "challah",
        "brioche",
        "pita",
        "rolls",
        "brioche",
        "baguette",
        "tortillas",
        "sub roll",
        "english muffins",
        "bagel",
        "hot dog buns",
        "pizza dough",
    },
    "canned & packaged": {
        "anchovy",
        "fruit preserves",
        "chickpeas",
        "beans",
        "sardines",
        "pumpkin puree",
        "canned tomatoes",
        "crushed tomatoes",
        "can whole tomatoes",
        "can whole peeled tomatoes",
        "cans of diced tomatoes",
        "can San Marzano tomatoes",
        "pumpkin purée",
        "marinara sauce",
        "tuna",
        "anchovies",
        "adobo",
        "stock",
        "cream of coconut",
        "chicken stock",
        "beef stock",
        "fish stock",
        "vegetable stock",
    },
    # kind of the misc category
    "condiments": {
        "tamari",
        "pesto",
        "horseradish",
        "peanut butter",
        "almond butter",
        "doubanjiang",
        "fish sauce",
        "gochujang",
        "salsa",
        "pickle",
        "pizza sauce",
        "mayo",
        "mayonnaise",
        "mango chutney",
        "marshmallows",
        "ketchup",
        "ketcup",
        "oil",
        "olive oil",
        "coconut oil",
        "honey",
        "dulce de leche",
        "hot sauce",
        "fish sauce",
        "capers",
        "vinegar",
        "soy sauce",
        "tamarind",
        "tahini",
        "tzatziki",
        "sprinkles",
        "sesame paste",
        "mustard",
        "seaweed",
        "jam",
        "maple syrup",
        "marmite",
        "sriracha",
        "ya cai",
        "yacai",
        "curry paste",
        "worcestershire sauce",
        "bean paste",
        "almond paste",
        "agave nectar",
        "olives",
    },
    "dry goods": {
        "gingersnaps",
        "pepitas",
        "currants",
        "powdered msg",
        "graham cracker",
        "tortilla chips",
        "breadcrumbs",
        "quinoa",
        "raisins",
        "masa harina",
        "polenta",
        "cornmeal",
        "panko",
        "orzo",
        "oatmeal",
        "oats",
        "lentils",
        "ladyfingers",
        "nilla wafers",
        "granola",
        "fritos",
        "bulgar",
        "bulgur",
        "millet",
        "flax seed",
        "coffee",
        "espresso",
        "chia",
        "couscous",
        "gelatin",
        "bati masala",
        "amaranth",
        "barley",
        "farro",
        "ramen",
        "fettuccine",
        "macaroni",
        "fusilli",
        "rotini",
        "penne",
        "rigatoni",
        "yeast",
        "rice",
        "pasta",
        "lasagna noodles",
        "tapioca",
        "cornstarch",
        "noodles",
        "spaghetti",
        "split peas",
    },
    "alcohol": {
        "wine",
        "beer",
        "rum",
        "vodka",
        "vermouth",
        "amaretto",
        "mirin",
        "bourbon",
        "brandy",
        "scotch",
        "cognac",
        "sherry",
        "guinness",
        "stout",
        "madeira",
        "marsala",
    },
    "spices": {
        "cinnamon",
        "curry powder",
        "sumac",
        "peppercorns",
        "paprika",
        "salt",
        "caraway seeds",
        "bati masala",
        "five-spice powder",
        "allspice",
        "pepper",
        "bay leaves",
        "miso",
        "cloves",
        "ground clove",
        "red chile flakes",
        "chile flakes",
        "chili flakes",
        "chili powder",
        "chilli powder",
        "chile powder",
        "cumin",
        "coriander",
        "corainder",
        "vanilla",
        "whole clove",
        "nutmeg",
        "turmeric",
        "sesame seed",
        "mustard seed",
        "dried chilies",
        "dried chiles",
        "fenugreek",
        "ground chiles",
        "baharat",
        "seasoning",
        "star anise",
        "marjoram",
        "bay leaf",
        "almond extract",
        "cardamom",
        "cayenne",
        "cream of tartar",
        "garam masala",
        "herbes de provence",
        "saffron",
        "niger seed",
        "nigella seed",
        "peperoncino flakes",
    },
    "nuts": {
        "pecans",
        "pecan",
        "pine nuts",
        "peanuts",
        "walnut",
        "almonds",
        "nuts",
        "cashews",
        "pistachios",
    },
    "other": {
        "cedar shakes",
        "water",
        "ice",
        "gloves",
        "skewers",
    },
}


def create_trie(mapping: Mapping[str, Set[str]]) -> Dict[str, Any]:
    trie: Dict[str, Any] = {}
    for category, ingredients in mapping.items():
        for ingredient in ingredients:
            tree = trie
            words = [singularize(x) for x in ingredient.replace("-", " ").split()]
            for idx, word in enumerate(words):
                if word in tree:
                    tree = tree[word]
                else:
                    tree[word] = {}
                    tree = tree[word]
                is_last = idx == len(words) - 1
                if is_last and "$" not in tree:
                    tree["$"] = (category, len(ingredient))
    return trie


trie = create_trie(DEPARTMENT_MAPPING)


def search(item: str, trie: Dict[str, Any] = trie) -> Dict[str, Set[int]]:
    items = [singularize(x) for x in item.split()]
    counts = defaultdict(set)
    for start in range(len(items)):
        tree = trie
        for word in items[start:]:
            if word not in tree:
                break
            tree = tree[word]
            if "$" in tree:
                cat, cnt = tree["$"]
                counts[cat].add(cnt)
    return counts


def category(ingredient: str) -> str:
    res = search(
        ingredient.lower()
        .replace("-", " ")
        .replace(",", "")
        .replace(")", "")
        .replace("(", "")
    )
    if not res:
        return "unknown"

    return sorted(res.items(), key=lambda x: -max(x[1]))[0][0]
