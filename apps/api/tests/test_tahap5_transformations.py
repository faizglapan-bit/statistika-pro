import pytest
from transformation_engine import (
    validate_expression,
    evaluate_expression_on_rows,
    recode_series,
    reverse_score_series,
    compute_composite_score,
    standardize_series,
    categorize_series,
)
from schemas.transformation import RecodeRule


def test_expression_parser_arithmetic_and_functions():
    rows = [
        {"Q1": 4, "Q2": 5, "Q3": 3},
        {"Q1": 2, "Q2": 4, "Q3": 3},
        {"Q1": None, "Q2": 5, "Q3": 3},  # row with missing
    ]
    var_names = ["Q1", "Q2", "Q3"]

    # 1. Penjumlahan sederhana
    res, warns = evaluate_expression_on_rows("Q1 + Q2", rows, var_names)
    assert res[0] == 9
    assert res[1] == 6
    assert res[2] is None  # Missing must stay missing!

    # 2. Fungsi MEAN
    res, warns = evaluate_expression_on_rows("MEAN(Q1, Q2, Q3)", rows, var_names)
    assert round(res[0], 2) == 4.0
    assert round(res[1], 2) == 3.0
    # For row 2, Q1 is None, mean of Q2 and Q3 (5 and 3) is 4.0
    assert round(res[2], 2) == 4.0

    # 3. Pangkat dan SQRT
    res, warns = evaluate_expression_on_rows("SQRT(Q2 ^ 2)", rows, var_names)
    assert res[0] == 5.0
    assert res[1] == 4.0


def test_expression_parser_conditional_if():
    rows = [
        {"AGE": 25, "INCOME": 5000},
        {"AGE": 16, "INCOME": 2000},
        {"AGE": 30, "INCOME": 8000},
    ]
    var_names = ["AGE", "INCOME"]
    res, warns = evaluate_expression_on_rows("IF(AGE >= 18, 1, 0)", rows, var_names)
    assert res == [1, 0, 1]


def test_expression_parser_division_by_zero():
    rows = [{"X": 10, "Y": 0}, {"X": 10, "Y": 2}]
    res, warns = evaluate_expression_on_rows("X / Y", rows, ["X", "Y"])
    assert res[0] is None
    assert res[1] == 5.0
    assert any("pembagian dengan nol" in w.lower() for w in warns)


def test_expression_parser_security_rejection():
    # Pastikan kode arbitrer atau evaluasi berbahaya ditolak
    with pytest.raises(ValueError):
        validate_expression("__import__('os').system('dir')", ["X"])

    with pytest.raises(ValueError):
        validate_expression("open('secret.txt').read()", ["X"])

    with pytest.raises(ValueError):
        validate_expression("exec('x = 1')", ["X"])


def test_recode_series():
    values = [1, 2, 3, 4, 5, None, 99]
    rules = [
        RecodeRule(rule_type="single", old_value=1, new_value=10),
        RecodeRule(rule_type="range", range_min=2, range_max=4, new_value=20),
        RecodeRule(rule_type="thru_highest", range_min=5, new_value=30),
        RecodeRule(rule_type="else", new_value=999, is_missing=False),
    ]
    res, warns = recode_series(values, rules, target_type="numeric")
    assert res[0] == 10
    assert res[1] == 20
    assert res[2] == 20
    assert res[3] == 20
    assert res[4] == 30
    assert res[5] is None  # None stays None unless is_missing rule matched


def test_reverse_scoring():
    values = [1, 2, 3, 4, 5, None, 6]
    res, warns = reverse_score_series(values, scale_min=1.0, scale_max=5.0)
    assert res[0] == 5
    assert res[1] == 4
    assert res[2] == 3
    assert res[3] == 2
    assert res[4] == 1
    assert res[5] is None
    assert res[6] == 0  # 1+5 - 6 = 0 with out of bounds warning
    assert len(warns) > 0


def test_composite_score():
    rows = [
        {"Q1": 4, "Q2": 4, "Q3": 4, "Q4": 4},
        {"Q1": 2, "Q2": None, "Q3": 4, "Q4": 4},  # 3 valid
        {"Q1": None, "Q2": None, "Q3": 4, "Q4": 4},  # 2 valid
    ]
    vars_list = ["Q1", "Q2", "Q3", "Q4"]

    # Aturan: minimal 3 item valid
    res_mean, warns = compute_composite_score(rows, vars_list, method="mean", min_valid_items=3)
    assert res_mean[0] == 4.0
    assert round(res_mean[1], 2) == 3.33  # mean(2, 4, 4)
    assert res_mean[2] is None  # Hanya 2 valid, kurang dari threshold 3!


def test_standardize_z_score():
    values = [10, 20, 30, 40, 50, None]
    res, warns = standardize_series(values)
    assert res[5] is None
    assert round(res[2], 2) == 0.0  # mean is 30, Z of 30 is 0
    assert res[0] < 0
    assert res[4] > 0

    # Variabel konstan
    const_values = [5, 5, 5, 5]
    res_c, warns_c = standardize_series(const_values)
    assert all(v == 0.0 for v in res_c)
    assert any("konstan" in w.lower() for w in warns_c)


def test_categorize_series():
    values = [15, 25, 35, 45, 55, None]
    res, warns = categorize_series(values, method="cutpoints", cutpoints=[20, 40], category_labels=["Rendah", "Sedang", "Tinggi"])
    assert res[0] == "Rendah"
    assert res[1] == "Sedang"
    assert res[2] == "Sedang"
    assert res[3] == "Tinggi"
    assert res[4] == "Tinggi"
    assert res[5] is None
