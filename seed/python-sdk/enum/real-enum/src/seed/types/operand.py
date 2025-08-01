# This file was auto-generated by Fern from our API Definition.

import enum
import typing

T_Result = typing.TypeVar("T_Result")
class Operand(str, enum.Enum):
    """
    Tests enum name and value can be
    different.
    
    Examples
    --------
    from seed import Operand
    
    Operand.GREATER_THAN
    """
    GREATER_THAN = ">"
    EQUAL_TO = "="
    LESS_THAN = "less_than"
    """
    The name and value should be similar
    are similar for less than.
    """
    
    
    def visit(self, greater_than: typing.Callable[[], T_Result], equal_to: typing.Callable[[], T_Result], less_than: typing.Callable[[], T_Result]) -> T_Result:
        if self is Operand.GREATER_THAN:
            return greater_than(
            )
        if self is Operand.EQUAL_TO:
            return equal_to(
            )
        if self is Operand.LESS_THAN:
            return less_than(
            )
