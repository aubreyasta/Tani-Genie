from pest_risk.config import load_crop_registry, load_rule_registry, normalize_crop


def test_rule_registry_loads() -> None:
    registry = load_rule_registry("configs/disease_rules.yaml")
    assert "rice_blast" in registry.diseases
    assert len(registry.diseases["rice_blast"].rules) >= 4


def test_crop_alias_normalization() -> None:
    registry = load_crop_registry("configs/crops.yaml")
    assert normalize_crop("cabai merah", registry) == "chili_red"
    assert normalize_crop("bawang_putih", registry) == "garlic"
