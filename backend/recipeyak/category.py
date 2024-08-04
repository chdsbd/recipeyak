from __future__ import annotations

from collections import defaultdict
from functools import cache
from typing import Any

from recipeyak.inflect import singularize

_DEPARTMENT_MAPPING = {
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
        "yamaimo",
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
        "guacamole",
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
        "bird eye chillies",
        "carrot",
        "chive",
        "avocado",
        "watercress",
        "cabbage",
        "scallions",
        "lime",
        "thyme",
        "radish",
        "lemon",
        "tomato",
        "cherry",
        "grape",
        "lettuce",
        "shallot",
        "rosemary",
        "apple",
        "pineapple",
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
        "poblano pepper",
        "fresno pepper",
        "onion",
        "parsley",
        "parsely",
        "mint",
        "garlic",
        "cloves garlic",
        "ginger",
        "clementine",
        "celery",
        "oregano",
        "cucumber",
    },
    "meat": {
        "chicken",
        "shrimp",
        "mussels",
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
        "vegetable shortening",
        "malted milk powder",
        "corn syrup",
        "coconut sugar",
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
        "frozen gyoza",
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
        "rolls",
        "baguette",
        "tortillas",
        "barley rusks",
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
        "arrabbiata sauce",
        "oyster sauce",
        "tomato paste",
        "tuna",
        "anchovies",
        "adobo",
        "broth",
        "chicken broth",
        "stock",
        "coconut milk",
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
        "chimichurri",
        "pickle",
        "pizza sauce",
        "aioli",
        "mayo",
        "mayonnaise",
        "mango chutney",
        "marshmallows",
        "ketchup",
        "ketcup",
        "oil",
        "olive oil",
        "coconut oil",
        "peanut oil",
        "honey",
        "dulce de leche",
        "hot sauce",
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
        "matcha",
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
        "amaranth",
        "katsuobushi",
        "ao nori",
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
        "pastina",
        "split peas",
    },
    "spices": {
        "asafetida",
        "cinnamon",
        "curry powder",
        "sumac",
        "peppercorns",
        "za'atar",
        "paprika",
        "salt",
        "furikake",
        "caraway seeds",
        "bati masala",
        "masala",
        "five-spice powder",
        "mustard powder",
        "garlic powder",
        "allspice",
        "onion powder",
        "dried oregano",
        "ground ginger",
        "pepper",
        "bay leaves",
        "miso",
        "cloves",
        "fennel seed",
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
        "vanilla extract",
        "lemon extract",
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


@cache
def _create_trie() -> dict[str, Any]:
    trie: dict[str, Any] = {}
    for category, ingredients in _DEPARTMENT_MAPPING.items():
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


def _search(item: str) -> dict[str, set[int]]:
    trie = _create_trie()
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
    res = _search(
        ingredient.lower()
        .replace("-", " ")
        .replace(",", "")
        .replace(")", "")
        .replace("(", "")
        .replace("’", "'")  # noqa: RUF001
    )
    if not res:
        return "unknown"

    return sorted(res.items(), key=lambda x: -max(x[1]))[0][0]
