from __future__ import annotations

from decimal import Decimal

import pytest

from recipeyak.combine import Quantity
from recipeyak.parsing import (
    IncompatibleUnitError,
    Unit,
    _fraction_to_decimal,
    _IngredientResult,
    _parse_name_description,
    _parse_quantity_name,
    parse_ingredient,
    parse_quantity,
)


@pytest.mark.parametrize(
    ("quantity", "expected"),
    [
        ("1/2 Tablespoon", Quantity(quantity=Decimal(0.5), unit=Unit.TABLESPOON)),
        ("3 1/2 Tablespoon", Quantity(quantity=Decimal(3.5), unit=Unit.TABLESPOON)),
        ("1 tsp", Quantity(quantity=Decimal(1), unit=Unit.TEASPOON)),
        ("4 oz", Quantity(quantity=Decimal(4), unit=Unit.OUNCE)),
        ("4 ounces/112 grams", Quantity(quantity=Decimal(4), unit=Unit.OUNCE)),
        ("4 ounces", Quantity(quantity=Decimal(4), unit=Unit.OUNCE)),
        ("1 1/2 cups", Quantity(quantity=Decimal(1.5), unit=Unit.CUP)),
        ("3lbs", Quantity(quantity=Decimal(3), unit=Unit.POUND)),
        ("225 grams", Quantity(quantity=Decimal(225), unit=Unit.GRAM)),
        ("1 kg", Quantity(quantity=Decimal(1), unit=Unit.KILOGRAM)),
        ("pinch", Quantity(quantity=Decimal(1), unit=Unit.SOME)),
        ("1/2 liter", Quantity(quantity=Decimal(0.5), unit=Unit.LITER)),
        ("180 milliliters", Quantity(quantity=Decimal(180), unit=Unit.MILLILITER)),
        ("2 quarts", Quantity(quantity=Decimal(2), unit=Unit.QUART)),
        ("1/2 gallon", Quantity(quantity=Decimal(0.5), unit=Unit.GALLON)),
        ("½ gallon", Quantity(quantity=Decimal(0.5), unit=Unit.GALLON)),
        ("⅓ tsp", Quantity(quantity=Decimal(1) / Decimal(3), unit=Unit.TEASPOON)),
        ("1/8 t", Quantity(quantity=Decimal(1) / Decimal(8), unit=Unit.TEASPOON)),
        ("1/8 T", Quantity(quantity=Decimal(1) / Decimal(8), unit=Unit.TABLESPOON)),
        ("1 tbs", Quantity(quantity=Decimal(1), unit=Unit.TABLESPOON)),
        ("4-5", Quantity(quantity=Decimal(5), unit=Unit.NONE)),
        ("4 to 6", Quantity(quantity=Decimal(6), unit=Unit.NONE)),
        ("1lb", Quantity(quantity=Decimal(1), unit=Unit.POUND)),
        ("1 pound", Quantity(quantity=Decimal(1), unit=Unit.POUND)),
        ("1 bag", Quantity(quantity=Decimal(1), unit=Unit.UNKNOWN, unknown_unit="bag")),
        (
            "1¾ cups",
            Quantity(quantity=Decimal(1.75), unit=Unit.CUP),
        ),
        (
            "1 Tablespoon + 1 teaspoon",
            Quantity(quantity=Decimal(4), unit=Unit.TEASPOON),
        ),
        ("some", Quantity(quantity=Decimal(1), unit=Unit.SOME)),
        ("1", Quantity(quantity=Decimal(1), unit=Unit.NONE)),
    ],
)
def test_parsing_quantities(quantity: str, expected: Quantity | None) -> None:
    assert parse_quantity(quantity) == expected


@pytest.mark.parametrize(
    ("fraction", "expected"),
    [("1/2", Decimal(0.5)), ("11/2", Decimal(5.5)), ("1 1/2", Decimal(1.5))],
)
def test_fraction_to_decimal(fraction: str, expected: Decimal | None) -> None:
    assert _fraction_to_decimal(fraction) == expected


@pytest.mark.parametrize(
    ("quantities", "expected"),
    [
        (
            (
                Quantity(quantity=Decimal(3), unit=Unit.POUND),
                Quantity(quantity=Decimal(1), unit=Unit.POUND),
            ),
            Quantity(quantity=Decimal(4), unit=Unit.POUND),
        ),
        (
            (
                Quantity(quantity=Decimal(0.5), unit=Unit.LITER),
                Quantity(quantity=Decimal(1), unit=Unit.LITER),
            ),
            Quantity(quantity=Decimal(1.5), unit=Unit.LITER),
        ),
        (
            (
                Quantity(quantity=Decimal(1), unit=Unit.TEASPOON),
                Quantity(quantity=Decimal(3), unit=Unit.TABLESPOON),
            ),
            Quantity(quantity=Decimal(10), unit=Unit.TEASPOON),
        ),
        (
            (
                Quantity(quantity=Decimal(1), unit=Unit.NONE),
                Quantity(quantity=Decimal(3), unit=Unit.NONE),
            ),
            Quantity(quantity=Decimal(4), unit=Unit.NONE),
        ),
        # check ordering
        (
            (
                Quantity(quantity=Decimal(150), unit=Unit.GRAM),
                Quantity(quantity=Decimal(1), unit=Unit.KILOGRAM),
            ),
            Quantity(quantity=Decimal(1150), unit=Unit.GRAM),
        ),
        (
            (
                Quantity(quantity=Decimal(1), unit=Unit.KILOGRAM),
                Quantity(quantity=Decimal(150), unit=Unit.GRAM),
            ),
            Quantity(quantity=Decimal(1150), unit=Unit.GRAM),
        ),
        # `some` should be removed when combined with a proper amount
        (
            (
                Quantity(quantity=Decimal(2), unit=Unit.TEASPOON),
                Quantity(quantity=Decimal(1), unit=Unit.SOME),
            ),
            Quantity(quantity=Decimal(2), unit=Unit.TEASPOON),
        ),
        (
            (
                Quantity(quantity=Decimal(1), unit=Unit.SOME),
                Quantity(quantity=Decimal(2), unit=Unit.TEASPOON),
            ),
            Quantity(quantity=Decimal(2), unit=Unit.TEASPOON),
        ),
        (
            (
                Quantity(quantity=Decimal(1), unit=Unit.UNKNOWN, unknown_unit="bag"),
                Quantity(quantity=Decimal(1), unit=Unit.UNKNOWN, unknown_unit="bag"),
            ),
            Quantity(quantity=Decimal(2), unit=Unit.UNKNOWN, unknown_unit="bag"),
        ),
    ],
)
def test_quantity_addition(
    quantities: tuple[Quantity, Quantity], expected: Quantity
) -> None:
    a, b = quantities
    assert a + b == expected


def test_adding_quantities_with_diff_unknown_units() -> None:
    """
    Units that are unknown shouldn't be combined if the `unknown_unit`
    doesn't match.
    """

    with pytest.raises(IncompatibleUnitError):
        Quantity(quantity=Decimal(1), unit=Unit.UNKNOWN, unknown_unit="bag") + Quantity(
            quantity=Decimal(2), unit=Unit.UNKNOWN, unknown_unit="thing"
        )


def test_adding_incompatible_units() -> None:
    """
    MASS and VOLUME units should raise an error on addition. We handle this
    error higher up.
    """
    with pytest.raises(IncompatibleUnitError):
        Quantity(quantity=Decimal(1), unit=Unit.TABLESPOON) + Quantity(
            quantity=Decimal(2), unit=Unit.GRAM
        )


@pytest.mark.parametrize(
    ("ingredient", "expected"),
    [
        (
            "1 cup plain whole-milk yogurt",
            (
                "1 cup",
                "plain whole-milk yogurt",
            ),
        ),
        (
            "fine sea salt",
            (
                "",
                "fine sea salt",
            ),
        ),
        ("2 garlic cloves, grated", ("2", "garlic cloves, grated")),
        (
            "1 tablespoon chopped fresh oregano (or 1 teaspoon dried oregano)",
            ("1 tablespoon", "chopped fresh oregano (or 1 teaspoon dried oregano)"),
        ),
        (
            "12 ounces (about 4 to 5) skinless, boneless chicken thighs",
            ("12 ounces (about 4 to 5)", "skinless, boneless chicken thighs"),
        ),
        (
            "1 1/2 teaspoons minced fresh thyme (or 1/2 teaspoon dried thyme)",
            ("1 1/2 teaspoons", "minced fresh thyme (or 1/2 teaspoon dried thyme)"),
        ),
        (
            "1 tablespoon olive oil, plus more for the grill or pan",
            ("1 tablespoon", "olive oil, plus more for the grill or pan"),
        ),
        (
            "1 teaspoon kosher salt (Diamond Crystal), plus more for serving",
            ("1 teaspoon", "kosher salt (Diamond Crystal), plus more for serving"),
        ),
        (
            "1/4 teaspoon black pepper, plus more for serving",
            ("1/4 teaspoon", "black pepper, plus more for serving"),
        ),
        (
            "1 lemon",
            ("1", "lemon"),
        ),
        (
            "1 cup flour",
            ("1 cup", "flour"),
        ),
        (
            "1 kg cheese",
            ("1 kg", "cheese"),
        ),
        (
            "1g water",
            ("1g", "water"),
        ),
        (
            # TODO(sbdchd): more of range test cases
            "1-3 lbs ground turkey breast",
            ("1-3 lbs", "ground turkey breast"),
        ),
        (
            "7 to 8 cups poison",
            ("7 to 8 cups", "poison"),
        ),
        (
            "3 1/2 cups water",
            ("3 1/2 cups", "water"),
        ),
        (
            "1 tbsp light soy sauce",
            ("1 tbsp", "light soy sauce"),
        ),
        (
            "2 pounds boneless skinless chicken thighs",
            ("2 pounds", "boneless skinless chicken thighs"),
        ),
        (
            "1 pound rigatoni or another ridged dried pasta, or fresh pappardelle or tagliatelle",
            (
                "1 pound",
                "rigatoni or another ridged dried pasta, or fresh pappardelle or tagliatelle",
            ),
        ),
        (
            "Chopped fresh parsley, for serving (optional)",
            ("", "Chopped fresh parsley, for serving (optional)"),
        ),
        ("Pinch of ground cardamom", ("Pinch of", "ground cardamom")),
        (
            "8 ounces frozen (no need to thaw) or fresh green peas (about 1¾ cups)",
            # NOTE: parser limitation
            (
                "8 ounces",
                "frozen (no need to thaw) or fresh green peas (about 1 3/4 cups)",
            ),
        ),
        (
            "2 Tablespoons plus 1/2 teaspoon extra-virgin olive oil",
            ("2 Tablespoons plus 1/2 teaspoon", "extra-virgin olive oil"),
        ),
        (
            "2 Tablespoons + 1/2 teaspoon extra-virgin olive oil",
            ("2 Tablespoons + 1/2 teaspoon", "extra-virgin olive oil"),
        ),
        (
            "1/2 cup (8 Tablespoons)/115 grams unsalted butter, very soft",
            ("1/2 cup (8 Tablespoons)/115 grams", "unsalted butter, very soft"),
        ),
    ],
)
def test_parse_quantity_name(ingredient: str, expected: tuple[str, str]) -> None:
    assert _parse_quantity_name(ingredient) == expected


@pytest.mark.parametrize(
    ("ingredient", "expected"),
    [
        (
            "½ jalapeño pepper, seeded, ribs removed",
            ("½ jalapeño pepper", "seeded, ribs removed"),
        ),
        (
            "2 pounds (900g) bone-in, skin-on chicken thighs",
            ("2 pounds (900g) bone-in, skin-on chicken thighs", ""),
        ),
        (
            "1 1/2 pounds boneless, skinless chicken breast, cut into 3/4-inch cubes",
            (
                "1 1/2 pounds boneless, skinless chicken breast",
                "cut into 3/4-inch cubes",
            ),
        ),
        (
            "1 lb cooked, shredded chicken",
            ("1 lb cooked, shredded chicken", ""),
        ),
        (
            "2 pounds raw, cooked, frozen, skinless, shredded chicken",
            ("2 pounds raw, cooked, frozen, skinless, shredded chicken", ""),
        ),
        (
            "2 Tablespoons/30 grams argan oil, or walnut or peanut oil",
            ("2 Tablespoons/30 grams argan oil, or walnut or peanut oil", ""),
        ),
        ("1/4 cup salted, roasted peanuts", ("1/4 cup salted, roasted peanuts", "")),
        (
            "4 soft, sturdy hamburger buns, such as King's Hawaiian rolls",
            ("4 soft, sturdy hamburger buns", "such as King's Hawaiian rolls"),
        ),
        (
            "2 pounds mixed mushrooms (cremini, oyster, shitake), trimmed or stemmed and thinly sliced",
            (
                "2 pounds mixed mushrooms (cremini, oyster, shitake)",
                "trimmed or stemmed and thinly sliced",
            ),
        ),
    ],
)
def test_parse_name_description(ingredient: str, expected: tuple[str, str]) -> None:
    assert _parse_name_description(ingredient) == expected


@pytest.mark.parametrize(
    ("ingredient", "expected"),
    [
        (
            "1 cup plain whole-milk yogurt",
            _IngredientResult(
                quantity="1 cup",
                name="plain whole-milk yogurt",
            ),
        ),
        (
            "fine sea salt",
            _IngredientResult(
                quantity="some",
                name="fine sea salt",
            ),
        ),
        (
            "2 garlic cloves, grated",
            _IngredientResult(quantity="2", name="garlic cloves", description="grated"),
        ),
        (
            "Chopped fresh parsley, for serving (optional)",
            _IngredientResult(
                quantity="some",
                name="chopped fresh parsley",
                description="for serving",
                optional=True,
            ),
        ),
        (
            "Pinch of ground cardamom (optional)",
            _IngredientResult(
                quantity="Pinch of",
                name="ground cardamom",
                description="",
                optional=True,
            ),
        ),
        (
            "2 pounds (900g) bone-in, skin-on chicken thighs",
            _IngredientResult(
                quantity="2 pounds (900g)", name="bone-in, skin-on chicken thighs"
            ),
        ),
        (
            "½ jalapeño pepper, seeded, ribs removed",
            _IngredientResult(
                quantity="1/2",
                name="jalapeño pepper",
                description="seeded, ribs removed",
            ),
        ),
        (
            "1 large red bell pepper, seeded, ribs removed",
            _IngredientResult(
                quantity="1",
                name="large red bell pepper",
                description="seeded, ribs removed",
            ),
        ),
        (
            "2 Tablespoons plus 1/2 teaspoon extra-virgin olive oil",
            _IngredientResult(
                quantity="2 Tablespoons plus 1/2 teaspoon",
                name="extra-virgin olive oil",
            ),
        ),
        (
            "1 cup instant or kombu dashi (see Tip), vegetable or chicken broth, or water",
            # TODO: this isn't perfect, we can probably do better
            _IngredientResult(
                quantity="1 cup",
                name="instant or kombu dashi (see Tip)",
                description="vegetable or chicken broth, or water",
            ),
        ),
        (
            "Fresh corn tortillas and lime wedges, for serving",
            _IngredientResult(
                quantity="some",
                name="fresh corn tortillas and lime wedges",
                description="for serving",
            ),
        ),
        (
            "Kosher salt",
            _IngredientResult(
                quantity="some",
                name="kosher salt",
            ),
        ),
        (
            "Anaheim or Cubanelle peppers",
            _IngredientResult(
                quantity="some",
                name="Anaheim or Cubanelle peppers",
            ),
        ),
        (
            "2 Tablespoons, capers, rinsed, plus 1 Tablespoon brine",
            _IngredientResult(
                quantity="2 Tablespoons",
                name="capers",
                description="rinsed, plus 1 Tablespoon brine",
            ),
        ),
        pytest.param(
            "2 Tablespoons, lemon juice",
            _IngredientResult(
                quantity="2 Tablespoons",
                name="lemon juice",
            ),
            id="lemon-juice",
        ),
        pytest.param(
            "1 cup plus 2 Tablespoons/148 grams all-purpose flour, plus more for dusting",
            _IngredientResult(
                quantity="1 cup plus 2 Tablespoons/148 grams",
                name="all-purpose flour",
                description="plus more for dusting",
            ),
            id="flour",
        ),
        pytest.param(
            "1 large, ripe tomato, halved horizontally",
            _IngredientResult(
                quantity="1",
                name="large, ripe tomato",
                description="halved horizontally",
            ),
            id="tomato",
        ),
        pytest.param(
            "2 pounds mixed mushrooms (cremini, oyster, shitake), trimmed or stemmed and thinly sliced",
            _IngredientResult(
                quantity="2 pounds",
                name="mixed mushrooms (cremini, oyster, shitake)",
                description="trimmed or stemmed and thinly sliced",
            ),
            id="mushrooms",
        ),
    ],
)
def test_parse_ingredient(ingredient: str, expected: _IngredientResult) -> None:
    assert parse_ingredient(ingredient) == expected
