import ast
import re
import math
from typing import Dict, Any, List, Tuple, Optional, Set
import numpy as np
import pandas as pd


ALLOWED_AST_NODES = (
    ast.Expression,
    ast.BinOp,
    ast.UnaryOp,
    ast.Call,
    ast.Name,
    ast.Constant,
    ast.Compare,
    ast.BoolOp,
    ast.IfExp,
    ast.Load,
    ast.Tuple,
    ast.List,
    # Operator nodes
    ast.Add,
    ast.Sub,
    ast.Mult,
    ast.Div,
    ast.FloorDiv,
    ast.Mod,
    ast.Pow,
    ast.USub,
    ast.UAdd,
    ast.Not,
    ast.Eq,
    ast.NotEq,
    ast.Lt,
    ast.LtE,
    ast.Gt,
    ast.GtE,
    ast.And,
    ast.Or,
)


def _safe_mean(*args):
    valid = [a for a in args if a is not None and not (isinstance(a, float) and math.isnan(a))]
    if not valid:
        return None
    return float(np.mean(valid))


def _safe_sum(*args):
    valid = [a for a in args if a is not None and not (isinstance(a, float) and math.isnan(a))]
    if not valid:
        return None
    return float(np.sum(valid))


def _safe_min(*args):
    valid = [a for a in args if a is not None and not (isinstance(a, float) and math.isnan(a))]
    if not valid:
        return None
    return float(np.min(valid))


def _safe_max(*args):
    valid = [a for a in args if a is not None and not (isinstance(a, float) and math.isnan(a))]
    if not valid:
        return None
    return float(np.max(valid))


def _safe_abs(val):
    if val is None or (isinstance(val, float) and math.isnan(val)):
        return None
    return abs(float(val))


def _safe_sqrt(val):
    if val is None or (isinstance(val, float) and math.isnan(val)):
        return None
    f = float(val)
    if f < 0:
        return None
    return math.sqrt(f)


def _safe_log(val):
    """Log basis 10"""
    if val is None or (isinstance(val, float) and math.isnan(val)):
        return None
    f = float(val)
    if f <= 0:
        return None
    return math.log10(f)


def _safe_ln(val):
    """Log basis e (natural log)"""
    if val is None or (isinstance(val, float) and math.isnan(val)):
        return None
    f = float(val)
    if f <= 0:
        return None
    return math.log(f)


def _safe_exp(val):
    if val is None or (isinstance(val, float) and math.isnan(val)):
        return None
    try:
        return math.exp(float(val))
    except OverflowError:
        return None


def _safe_round(val, decimals=0):
    if val is None or (isinstance(val, float) and math.isnan(val)):
        return None
    return round(float(val), int(decimals))


def _safe_if(condition, true_val, false_val=None):
    if condition is None:
        return None
    return true_val if bool(condition) else false_val


ALLOWED_FUNCTIONS = {
    "mean": _safe_mean,
    "sum": _safe_sum,
    "min": _safe_min,
    "max": _safe_max,
    "abs": _safe_abs,
    "sqrt": _safe_sqrt,
    "log": _safe_log,
    "log10": _safe_log,
    "ln": _safe_ln,
    "exp": _safe_exp,
    "round": _safe_round,
    "if": _safe_if,
}

ALLOWED_CONSTANTS = {
    "pi": math.pi,
    "e": math.e,
    "true": True,
    "false": False,
    "null": None,
    "none": None,
    "nan": None,
}


class SafeEvaluator(ast.NodeVisitor):
    def __init__(self, context: Dict[str, Any], warnings_list: List[str]):
        self.context = context  # {var_name_lower: value}
        self.warnings = warnings_list

    def visit(self, node):
        if not isinstance(node, ALLOWED_AST_NODES):
            raise ValueError(f"Ekspresi mengandung konstruksi yang dilarang: {type(node).__name__}")
        return super().visit(node)

    def visit_Expression(self, node: ast.Expression):
        return self.visit(node.body)

    def visit_Constant(self, node: ast.Constant):
        return node.value

    def visit_Name(self, node: ast.Name):
        name_lower = node.id.lower()
        if name_lower in ALLOWED_CONSTANTS:
            return ALLOWED_CONSTANTS[name_lower]
        if name_lower in self.context:
            val = self.context[name_lower]
            if val is None or (isinstance(val, float) and math.isnan(val)):
                return None
            return val
        raise ValueError(f"Variabel tidak ditemukan dalam dataset: '{node.id}'")

    def visit_UnaryOp(self, node: ast.UnaryOp):
        val = self.visit(node.operand)
        if val is None:
            return None
        if isinstance(node.op, ast.USub):
            return -float(val)
        elif isinstance(node.op, ast.UAdd):
            return float(val)
        elif isinstance(node.op, ast.Not):
            return not bool(val)
        raise ValueError(f"Operator unary tidak didukung: {type(node.op).__name__}")

    def visit_BinOp(self, node: ast.BinOp):
        left = self.visit(node.left)
        right = self.visit(node.right)
        if left is None or right is None:
            return None
        try:
            l_num, r_num = float(left), float(right)
        except (ValueError, TypeError):
            # String concatenation if both strings and Add
            if isinstance(node.op, ast.Add) and isinstance(left, str) and isinstance(right, str):
                return left + right
            return None

        if isinstance(node.op, ast.Add):
            return l_num + r_num
        elif isinstance(node.op, ast.Sub):
            return l_num - r_num
        elif isinstance(node.op, ast.Mult):
            return l_num * r_num
        elif isinstance(node.op, (ast.Div, ast.FloorDiv)):
            if r_num == 0:
                if "Pembagian dengan nol terdeteksi (hasil diatur menjadi missing)" not in self.warnings:
                    self.warnings.append("Pembagian dengan nol terdeteksi (hasil diatur menjadi missing)")
                return None
            return l_num / r_num if isinstance(node.op, ast.Div) else l_num // r_num
        elif isinstance(node.op, ast.Mod):
            if r_num == 0:
                return None
            return l_num % r_num
        elif isinstance(node.op, ast.Pow):
            try:
                res = l_num ** r_num
                if isinstance(res, complex):
                    return None
                return res
            except (OverflowError, ValueError):
                return None
        raise ValueError(f"Operator biner tidak didukung: {type(node.op).__name__}")

    def visit_BoolOp(self, node: ast.BoolOp):
        if isinstance(node.op, ast.And):
            for v in node.values:
                val = self.visit(v)
                if val is None:
                    return None
                if not bool(val):
                    return False
            return True
        elif isinstance(node.op, ast.Or):
            has_none = False
            for v in node.values:
                val = self.visit(v)
                if val is None:
                    has_none = True
                    continue
                if bool(val):
                    return True
            return None if has_none else False
        raise ValueError(f"Operator boolean tidak didukung: {type(node.op).__name__}")

    def visit_Compare(self, node: ast.Compare):
        left = self.visit(node.left)
        if left is None:
            return None
        for op, comparator in zip(node.ops, node.comparators):
            right = self.visit(comparator)
            if right is None:
                return None
            
            # Numeric compare if possible
            try:
                l_val, r_val = float(left), float(right)
            except (ValueError, TypeError):
                l_val, r_val = str(left), str(right)

            matched = False
            if isinstance(op, ast.Eq):
                matched = (l_val == r_val)
            elif isinstance(op, ast.NotEq):
                matched = (l_val != r_val)
            elif isinstance(op, ast.Lt):
                matched = (l_val < r_val)
            elif isinstance(op, ast.LtE):
                matched = (l_val <= r_val)
            elif isinstance(op, ast.Gt):
                matched = (l_val > r_val)
            elif isinstance(op, ast.GtE):
                matched = (l_val >= r_val)
            else:
                raise ValueError(f"Operator perbandingan tidak didukung: {type(op).__name__}")

            if not matched:
                return False
            left = right
        return True

    def visit_Call(self, node: ast.Call):
        if not isinstance(node.func, ast.Name):
            raise ValueError("Hanya pemanggilan fungsi nama langsung yang diizinkan")
        func_name = node.func.id.lower()
        if func_name not in ALLOWED_FUNCTIONS:
            raise ValueError(f"Fungsi '{node.func.id}' tidak diizinkan. Fungsi yang diizinkan: {list(ALLOWED_FUNCTIONS.keys())}")
        
        args = [self.visit(a) for a in node.args]
        func = ALLOWED_FUNCTIONS[func_name]
        try:
            return func(*args)
        except Exception as e:
            if f"Kesalahan saat menjalankan fungsi {func_name}: {str(e)}" not in self.warnings:
                self.warnings.append(f"Kesalahan saat menjalankan fungsi {func_name}: {str(e)}")
            return None

    def visit_IfExp(self, node: ast.IfExp):
        cond = self.visit(node.test)
        if cond is None:
            return None
        return self.visit(node.body) if bool(cond) else self.visit(node.orelse)

    def visit_Tuple(self, node: ast.Tuple):
        return [self.visit(elt) for elt in node.elts]

    def visit_List(self, node: ast.List):
        return [self.visit(elt) for elt in node.elts]


def preprocess_expression(raw_expr: str) -> str:
    """Mengubah sintaks ramah SPSS/Excel menjadi sintaks Python AST yang valid."""
    expr = raw_expr.strip()
    if not expr:
        raise ValueError("Ekspresi tidak boleh kosong")

    # Ganti operator ^ dengan ** (pangkat) jika bukan di dalam string kutipan
    # Regex sederhana untuk mengganti ^ di luar tanda kutip
    parts = re.split(r"('[^']*'|\"[^\"]*\")", expr)
    for i in range(0, len(parts), 2):
        parts[i] = parts[i].replace("^", "**")
        # Ganti keyword AND, OR, NOT case-insensitive dengan spasi batas kata
        parts[i] = re.sub(r"\bAND\b", "and", parts[i], flags=re.IGNORECASE)
        parts[i] = re.sub(r"\bOR\b", "or", parts[i], flags=re.IGNORECASE)
        parts[i] = re.sub(r"\bNOT\b", "not", parts[i], flags=re.IGNORECASE)
        # Ganti = menjadi == jika bukan ==, <=, >=, !=
        parts[i] = re.sub(r"(?<![<>=!])=(?!=)", "==", parts[i])
        parts[i] = parts[i].replace("<>", "!=")

    return "".join(parts)


def validate_expression(raw_expr: str, available_variables: List[str]) -> Tuple[ast.Expression, List[str]]:
    """Memvalidasi keamanan ekspresi sebelum dieksekusi."""
    clean_expr = preprocess_expression(raw_expr)
    try:
        parsed = ast.parse(clean_expr, mode="eval")
    except SyntaxError as e:
        raise ValueError(f"Sintaks ekspresi tidak valid: {e.msg} (pada kolom {e.offset})")

    avail_lower = {v.lower() for v in available_variables}
    warnings: List[str] = []

    # Validasi node dan nama
    for node in ast.walk(parsed):
        if not isinstance(node, ALLOWED_AST_NODES):
            raise ValueError(f"Ekspresi mengandung konstruksi yang dilarang: {type(node).__name__}")
        if isinstance(node, ast.Name):
            name_lower = node.id.lower()
            if name_lower not in ALLOWED_CONSTANTS and name_lower not in ALLOWED_FUNCTIONS and name_lower not in avail_lower:
                raise ValueError(f"Variabel '{node.id}' tidak ditemukan dalam dataset aktif")
        elif isinstance(node, ast.Call):
            if not isinstance(node.func, ast.Name):
                raise ValueError("Pemanggilan metode bertingkat atau atribut tidak diizinkan")
            if node.func.id.lower() not in ALLOWED_FUNCTIONS:
                raise ValueError(f"Fungsi '{node.func.id}' tidak dikenali atau tidak diizinkan")

    return parsed, warnings


def evaluate_expression_on_rows(
    raw_expr: str,
    rows: List[Dict[str, Any]],
    available_variables: List[str],
) -> Tuple[List[Any], List[str]]:
    """Mengevaluasi ekspresi pada seluruh baris dataset dan mengembalikan daftar nilai hasil."""
    parsed, warnings = validate_expression(raw_expr, available_variables)
    results = []
    eval_warnings: List[str] = list(warnings)

    for row in rows:
        context = {k.lower(): v for k, v in row.items()}
        evaluator = SafeEvaluator(context, eval_warnings)
        try:
            val = evaluator.visit(parsed)
            # Tangani numpy scalars dan pembulatan float rapi
            if val is not None:
                if isinstance(val, (np.floating, float)):
                    if math.isnan(val) or math.isinf(val):
                        val = None
                    else:
                        val = round(float(val), 6)
                elif isinstance(val, (np.integer, int)):
                    val = int(val)
                elif isinstance(val, (np.bool_, bool)):
                    val = bool(val)
            results.append(val)
        except Exception as e:
            results.append(None)
            if str(e) not in eval_warnings:
                eval_warnings.append(str(e))

    return results, eval_warnings
