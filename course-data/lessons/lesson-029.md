# Lesson 29 — Interpreter Pattern

The **Interpreter Pattern** is used when you have a **small language, grammar, rule system, or expression syntax** that you want to represent and evaluate using objects.

The core idea is:

> Represent grammar rules as classes, build an expression tree, and interpret that tree recursively.

Typical use cases include:

```text
mathematical expressions
filter rules
search expressions
configuration rules
simple scripting
authorization policies
query languages
small domain-specific languages
```

This is the final classic GoF design pattern.

---

# 1. Start with the problem

Suppose we want to evaluate:

```text
1 + 2
```

Easy enough.

But then requirements grow:

```text
1 + 2 * 3

(1 + 2) * 3

x + y

age > 18

age > 18 AND country == "US"
```

We're no longer evaluating one hardcoded formula.

We're building a tiny **language**.

We need to understand expressions such as:

```text
number
addition
multiplication
variable
comparison
boolean AND
```

Interpreter gives us an object-oriented way to model that grammar.

---

# 2. Grammar

Before Interpreter makes sense, we need to understand the word:

> **Grammar**

A grammar describes valid structures in a language.

For a tiny arithmetic language, we might say:

```text
Expression :=
    Number
    OR Add
    OR Multiply
```

And:

```text
Add :=
    Expression + Expression
```

Multiply:

```text
Multiply :=
    Expression * Expression
```

Number:

```text
Number :=
    integer literal
```

So:

```text
2 + 3 * 4
```

is made from grammar rules.

Interpreter often maps those rules to classes.

---

# 3. Expression abstraction

Let's start with:

```java
interface Expression {

    int interpret();
}
```

Every grammar element can evaluate itself.

---

# 4. Number expression

A number is a terminal value.

```java
class NumberExpression
        implements Expression {

    private final int value;

    public NumberExpression(
            int value) {

        this.value = value;
    }

    @Override
    public int interpret() {

        return value;
    }
}
```

Usage:

```java
Expression expression =
        new NumberExpression(5);

System.out.println(
    expression.interpret()
);
```

Output:

```text
5
```

Simple.

---

# 5. Addition expression

Now represent:

```text
left + right
```

as an object.

```java
class AddExpression
        implements Expression {

    private final Expression left;
    private final Expression right;

    public AddExpression(
            Expression left,
            Expression right) {

        this.left = left;
        this.right = right;
    }

    @Override
    public int interpret() {

        return left.interpret()
                + right.interpret();
    }
}
```

Now:

```java
Expression expression =
        new AddExpression(
            new NumberExpression(2),
            new NumberExpression(3)
        );
```

Then:

```java
expression.interpret();
```

returns:

```text
5
```

---

# 6. Multiplication expression

```java
class MultiplyExpression
        implements Expression {

    private final Expression left;
    private final Expression right;

    public MultiplyExpression(
            Expression left,
            Expression right) {

        this.left = left;
        this.right = right;
    }

    @Override
    public int interpret() {

        return left.interpret()
                * right.interpret();
    }
}
```

Now we can represent:

```text
2 + (3 * 4)
```

as:

```java
Expression expression =
        new AddExpression(
            new NumberExpression(2),
            new MultiplyExpression(
                new NumberExpression(3),
                new NumberExpression(4)
            )
        );
```

Then:

```java
System.out.println(
    expression.interpret()
);
```

returns:

```text
14
```

---

# 7. Expression tree

Our object structure is:

```text
        Add
       /   \
      2   Multiply
          /      \
         3        4
```

Evaluation happens recursively.

`Add` asks:

```text
left, what are you worth?
right, what are you worth?
```

`Multiply` asks the same of its children.

Eventually we reach numbers.

---

# 8. Terminal expressions

In Interpreter terminology, a **terminal expression** is usually a leaf in the grammar.

Example:

```java
NumberExpression
```

It doesn't contain other expressions.

It simply produces a value.

Examples of terminals might be:

```text
number
string literal
variable
boolean literal
keyword
```

---

# 9. Non-terminal expressions

A **non-terminal expression** combines other expressions.

Examples:

```java
AddExpression
MultiplyExpression
AndExpression
OrExpression
```

For example:

```text
Add
├── Expression
└── Expression
```

Non-terminals form the recursive structure.

---

# 10. Classic Interpreter roles

The classic pattern often includes:

### Abstract Expression

```java
interface Expression
```

### Terminal Expression

```text
NumberExpression
VariableExpression
```

### Non-Terminal Expression

```text
AddExpression
MultiplyExpression
AndExpression
```

### Context

Contains information needed during interpretation.

For example:

```text
variable values
environment
user attributes
configuration
```

### Client

Builds the expression tree and calls:

```java
interpret(context)
```

---

# 11. Add a Context

Suppose we want:

```text
x + y
```

Now expressions need variable values.

Let's define:

```java
class Context {

    private final Map<String, Integer>
            variables =
            new HashMap<>();

    public void set(
            String name,
            int value) {

        variables.put(
            name,
            value
        );
    }

    public int get(
            String name) {

        Integer value =
                variables.get(name);

        if (value == null) {

            throw new
                IllegalArgumentException(
                    "Unknown variable: "
                    + name
                );
        }

        return value;
    }
}
```

---

# 12. Update the Expression interface

```java
interface Expression {

    int interpret(
        Context context
    );
}
```

Number:

```java
class NumberExpression
        implements Expression {

    private final int value;

    public NumberExpression(
            int value) {

        this.value = value;
    }

    @Override
    public int interpret(
            Context context) {

        return value;
    }
}
```

The number doesn't use the Context, but still follows the same contract.

---

# 13. Variable expression

```java
class VariableExpression
        implements Expression {

    private final String name;

    public VariableExpression(
            String name) {

        this.name = name;
    }

    @Override
    public int interpret(
            Context context) {

        return context.get(name);
    }
}
```

Now:

```java
Context context =
        new Context();

context.set("x", 10);
context.set("y", 20);
```

Expression:

```java
Expression expression =
        new AddExpression(
            new VariableExpression("x"),
            new VariableExpression("y")
        );
```

Then:

```java
expression.interpret(context);
```

returns:

```text
30
```

---

# 14. Arithmetic with variables

We can model:

```text
x + y * 2
```

as:

```java
Expression expression =
        new AddExpression(
            new VariableExpression("x"),
            new MultiplyExpression(
                new VariableExpression("y"),
                new NumberExpression(2)
            )
        );
```

If:

```text
x = 10
y = 5
```

the result is:

```text
20
```

because:

```text
10 + (5 × 2)
```

---

# 15. Why this is Interpreter

Each class corresponds to part of the grammar.

For example:

```text
Number
→ NumberExpression

Variable
→ VariableExpression

Expression + Expression
→ AddExpression

Expression * Expression
→ MultiplyExpression
```

The object hierarchy mirrors the language structure.

That's the defining idea.

---

# 16. Boolean rule example

Arithmetic is useful for teaching, but rule engines are often a more practical example.

Suppose we want rules like:

```text
age > 18
```

or:

```text
age > 18 AND country == "US"
```

Let's define:

```java
interface BooleanExpression {

    boolean interpret(
        RuleContext context
    );
}
```

---

# 17. Rule context

```java
class RuleContext {

    private final Map<String, Object>
            values =
            new HashMap<>();

    public void set(
            String name,
            Object value) {

        values.put(name, value);
    }

    public Object get(
            String name) {

        return values.get(name);
    }
}
```

Now we can store:

```text
age
country
accountType
riskScore
```

---

# 18. Greater-than expression

```java
class GreaterThanExpression
        implements BooleanExpression {

    private final String field;
    private final int threshold;

    public GreaterThanExpression(
            String field,
            int threshold) {

        this.field = field;
        this.threshold = threshold;
    }

    @Override
    public boolean interpret(
            RuleContext context) {

        int value =
            (Integer)
            context.get(field);

        return value > threshold;
    }
}
```

Now:

```java
BooleanExpression adult =
        new GreaterThanExpression(
            "age",
            18
        );
```

---

# 19. Equality expression

```java
class EqualsExpression
        implements BooleanExpression {

    private final String field;
    private final Object expected;

    public EqualsExpression(
            String field,
            Object expected) {

        this.field = field;
        this.expected = expected;
    }

    @Override
    public boolean interpret(
            RuleContext context) {

        Object actual =
                context.get(field);

        return Objects.equals(
            actual,
            expected
        );
    }
}
```

Now:

```java
BooleanExpression inUs =
        new EqualsExpression(
            "country",
            "US"
        );
```

---

# 20. AND expression

```java
class AndExpression
        implements BooleanExpression {

    private final BooleanExpression left;
    private final BooleanExpression right;

    public AndExpression(
            BooleanExpression left,
            BooleanExpression right) {

        this.left = left;
        this.right = right;
    }

    @Override
    public boolean interpret(
            RuleContext context) {

        return left.interpret(context)
            && right.interpret(context);
    }
}
```

Now:

```java
BooleanExpression rule =
        new AndExpression(
            new GreaterThanExpression(
                "age",
                18
            ),
            new EqualsExpression(
                "country",
                "US"
            )
        );
```

---

# 21. Evaluate the rule

```java
RuleContext context =
        new RuleContext();

context.set(
    "age",
    25
);

context.set(
    "country",
    "US"
);
```

Then:

```java
boolean allowed =
        rule.interpret(
            context
        );
```

Result:

```text
true
```

Change:

```text
country = "CA"
```

Result:

```text
false
```

---

# 22. Add OR

```java
class OrExpression
        implements BooleanExpression {

    private final BooleanExpression left;
    private final BooleanExpression right;

    public OrExpression(
            BooleanExpression left,
            BooleanExpression right) {

        this.left = left;
        this.right = right;
    }

    @Override
    public boolean interpret(
            RuleContext context) {

        return left.interpret(context)
            || right.interpret(context);
    }
}
```

Now we can model:

```text
country == "US"
OR
country == "CA"
```

---

# 23. Add NOT

```java
class NotExpression
        implements BooleanExpression {

    private final BooleanExpression expression;

    public NotExpression(
            BooleanExpression expression) {

        this.expression = expression;
    }

    @Override
    public boolean interpret(
            RuleContext context) {

        return !expression
                .interpret(context);
    }
}
```

Now the language is becoming richer.

---

# 24. Example authorization rule

Suppose access is allowed when:

```text
age > 18

AND

(country == "US"
 OR
 country == "CA")
```

Expression tree:

```text
               AND
              /   \
        age > 18    OR
                   /  \
             US check  CA check
```

Code:

```java
BooleanExpression accessRule =
        new AndExpression(
            new GreaterThanExpression(
                "age",
                18
            ),
            new OrExpression(
                new EqualsExpression(
                    "country",
                    "US"
                ),
                new EqualsExpression(
                    "country",
                    "CA"
                )
            )
        );
```

This is a small domain-specific language represented as objects.

---

# 25. Interpreter and Composite

You should immediately notice something.

Our expressions form trees:

```text
Expression
├── leaf
└── composite expression
```

That's very similar to Composite.

For example:

```text
AddExpression
HAS-A left Expression
HAS-A right Expression
```

So:

> Interpreter often uses Composite structure internally.

Composite answers:

> How do I model recursive part-whole structure?

Interpreter answers:

> How do those nodes represent and evaluate language rules?

---

# 26. Composite vs Interpreter

Composite:

```text
Folder
├── File
└── Folder
```

Interpreter:

```text
Add
├── Number
└── Multiply
```

Structurally similar.

But intent differs.

```text
Composite
= represent tree hierarchy

Interpreter
= represent grammar/language
```

---

# 27. Interpreter and Visitor

Remember our AST from Visitor?

```text
Expression
├── Number
├── Add
└── Multiply
```

We could implement evaluation directly:

```java
expression.interpret(context);
```

That's Interpreter style.

Or we could keep nodes passive and use:

```java
expression.accept(
    new EvaluationVisitor()
);
```

That's Visitor style.

---

# 28. Interpreter vs Visitor

Interpreter puts evaluation logic into grammar nodes:

```java
class AddExpression {

    int interpret() {
        return left.interpret()
            + right.interpret();
    }
}
```

Visitor keeps operations outside:

```java
class EvaluationVisitor {

    visitAdd(...)
}
```

So:

```text
Interpreter
→ grammar nodes know how to interpret

Visitor
→ external objects operate on grammar nodes
```

They can also coexist.

---

# 29. When Visitor is better for ASTs

Suppose an AST needs many operations:

```text
evaluate
pretty print
optimize
type check
generate bytecode
```

If every node contains all those methods:

```java
evaluate();
prettyPrint();
optimize();
typeCheck();
generateCode();
```

the hierarchy gets crowded.

Visitor may be better.

Interpreter is particularly natural when the main behavior is:

```text
interpret/evaluate
```

---

# 30. Interpreter vs Strategy

Strategy says:

> Pick one algorithm.

Interpreter says:

> Represent a language as expressions and recursively evaluate it.

Strategy:

```text
SortingStrategy
├── MergeSort
├── QuickSort
```

Interpreter:

```text
Expression
├── Number
├── Add
├── Multiply
```

Very different problem.

---

# 31. Interpreter vs State

State:

```text
object behavior depends
on current lifecycle state
```

Interpreter:

```text
expression behavior depends
on grammar tree structure
```

No real overlap except both use polymorphism.

---

# 32. Interpreter vs Chain of Responsibility

Chain:

```text
request flows through handlers
```

Interpreter:

```text
expression tree is recursively evaluated
```

Chain is sequential processing.

Interpreter is grammar evaluation.

---

# 33. Interpreter vs Template Method

Template Method defines:

```text
fixed algorithm skeleton
```

Interpreter defines:

```text
language grammar as object structure
```

Again, unrelated intent.

---

# 34. A mini query language

Imagine an application needs filters like:

```text
price > 100
AND
category == "BOOK"
```

Rather than hardcoding every combination, you could represent them as expression objects.

For example:

```java
BooleanExpression expensive =
        new GreaterThanExpression(
            "price",
            100
        );

BooleanExpression book =
        new EqualsExpression(
            "category",
            "BOOK"
        );

BooleanExpression filter =
        new AndExpression(
            expensive,
            book
        );
```

Then run it against products.

This is Interpreter-like rule evaluation.

---

# 35. Search query example

Suppose we support:

```text
java AND design
```

or:

```text
java OR kotlin
```

Expression hierarchy:

```text
SearchExpression
├── TermExpression
├── AndSearchExpression
└── OrSearchExpression
```

Terminal:

```java
class TermExpression
        implements SearchExpression {

    private final String term;

    ...
}
```

Non-terminals combine other expressions.

---

# 36. Permissions example

Suppose rules are:

```text
role == "ADMIN"
OR
(
  role == "MANAGER"
  AND
  department == "FINANCE"
)
```

Interpreter can model this very naturally.

This is one reason policy engines often resemble expression trees, though production systems are usually more sophisticated than classic GoF Interpreter.

---

# 37. A tiny command language

Suppose we're making a robot language:

```text
MOVE 10
TURN LEFT
MOVE 5
```

Grammar:

```text
Command :=
    Move
    OR Turn
```

Move:

```text
MOVE distance
```

Turn:

```text
TURN direction
```

We could model:

```java
interface RobotExpression {

    void interpret(
        RobotContext context
    );
}
```

---

# 38. Move expression

```java
class MoveExpression
        implements RobotExpression {

    private final int distance;

    public MoveExpression(
            int distance) {

        this.distance = distance;
    }

    @Override
    public void interpret(
            RobotContext context) {

        context.move(
            distance
        );
    }
}
```

Turn:

```java
class TurnExpression
        implements RobotExpression {

    private final Direction direction;

    public TurnExpression(
            Direction direction) {

        this.direction = direction;
    }

    @Override
    public void interpret(
            RobotContext context) {

        context.turn(
            direction
        );
    }
}
```

---

# 39. Sequence expression

We might also create:

```java
class SequenceExpression
        implements RobotExpression {

    private final List<
        RobotExpression
    > commands;

    @Override
    public void interpret(
            RobotContext context) {

        for (RobotExpression command
                : commands) {

            command.interpret(
                context
            );
        }
    }
}
```

Now we have a tiny language interpreter.

---

# 40. Parsing is a separate problem

This is extremely important.

So far we've manually built:

```java
new AddExpression(...)
```

But users may provide:

```text
2 + 3 * 4
```

as a string.

How do we turn that string into an expression tree?

That's:

> **Parsing**

Interpreter pattern itself does not solve parsing automatically.

---

# 41. Parsing pipeline

A full language implementation often has:

```text
source text
    ↓
tokenizer / lexer
    ↓
tokens
    ↓
parser
    ↓
syntax tree / expression tree
    ↓
interpreter
    ↓
result
```

Example:

```text
"2 + 3 * 4"
```

Tokenizer produces:

```text
NUMBER(2)
PLUS
NUMBER(3)
STAR
NUMBER(4)
```

Parser creates:

```text
        Add
       /   \
      2   Multiply
          /      \
         3        4
```

Interpreter evaluates:

```text
14
```

---

# 42. Lexer vs Parser vs Interpreter

A useful distinction:

### Lexer / tokenizer

Turns characters into tokens.

```text
"123 + x"
```

becomes:

```text
NUMBER(123)
PLUS
IDENTIFIER(x)
```

### Parser

Turns tokens into structure.

```text
Add(
    Number(123),
    Variable(x)
)
```

### Interpreter

Evaluates the structure.

```text
123 + value(x)
```

These are separate responsibilities.

---

# 43. Why Interpreter is usually for small languages

Classic Interpreter can become unwieldy when the grammar becomes large.

Imagine a full programming language with:

```text
variables
functions
loops
classes
exceptions
generics
pattern matching
modules
closures
async
types
```

You could theoretically keep creating classes.

But complexity grows dramatically.

At that point, use proper language tooling.

---

# 44. Don't build Java with GoF Interpreter

For serious language implementations, you'd usually consider:

```text
parser generators
ANTLR
compiler frameworks
formal grammar tools
dedicated parsers
```

Interpreter is best suited to:

```text
small DSLs
simple rule engines
query filters
compact expression languages
```

not giant languages.

---

# 45. Grammar class explosion

Suppose your language has 80 grammar rules.

You may end up with:

```text
80+ expression classes
```

That can become hard to maintain.

This is one of Interpreter's main weaknesses.

---

# 46. Performance concerns

Recursive expression objects add overhead:

```text
many small objects
recursive calls
dynamic dispatch
```

For small rule systems, this is fine.

For very high-performance evaluation, you may prefer:

```text
compiled expressions
bytecode
optimized ASTs
precomputed functions
```

Interpreter favors clarity and extensibility over maximum execution speed.

---

# 47. Repeated interpretation

Suppose the same rule is evaluated one million times:

```text
age > 18
AND
country == "US"
```

Building the expression tree each time would be wasteful.

Better:

```text
parse once
build tree once
reuse tree many times
```

Only the Context changes.

---

# 48. Context changes, grammar stays

For example:

```java
BooleanExpression rule =
        buildRuleOnce();
```

Then:

```java
for (User user : users) {

    RuleContext context =
            from(user);

    boolean result =
            rule.interpret(
                context
            );
}
```

This is more efficient.

---

# 49. Immutable expression trees

Expression nodes are good candidates for immutability.

For example:

```java
final class AndExpression {

    private final BooleanExpression left;
    private final BooleanExpression right;
}
```

Why?

Because grammar structure usually doesn't need to mutate during evaluation.

Immutable expression trees are:

```text
easier to reason about
safer to share
thread-friendly
cacheable
```

---

# 50. Context should hold runtime data

A useful separation is:

```text
Expression tree
→ grammar / rule definition

Context
→ runtime values
```

For example:

```text
Rule:
age > 18

Context:
age = 25
```

Don't rebuild the rule just because input data changes.

---

# 51. Interpreter and Flyweight

Suppose thousands of expressions reuse the same terminal symbols.

For example:

```text
country
age
status
```

You might reuse immutable terminal objects.

That can be Flyweight-like.

For example:

```text
VariableExpression("age")
```

could potentially be shared.

Again, patterns can combine.

---

# 52. Interpreter and Factory

Parsing often needs factories.

For example:

```java
Expression createOperator(
    Token token,
    Expression left,
    Expression right
)
```

might create:

```text
AddExpression
MultiplyExpression
AndExpression
```

Factory handles construction.

Interpreter handles evaluation.

---

# 53. Interpreter and Composite

This combination is especially important.

Our grammar tree:

```text
AND
├── age > 18
└── country == US
```

is naturally Composite-like.

Leaf:

```text
comparison/value
```

Composite:

```text
AND / OR
```

Then interpretation recursively walks the Composite.

---

# 54. Interpreter and Visitor

You could also create Visitors for:

```text
pretty printing
optimization
validation
debugging
```

while Interpreter handles:

```text
actual execution
```

For example:

```text
Expression tree
→ Interpreter-style evaluate()
→ Visitor-style pretty print
```

These patterns work well together.

---

# 55. Rule simplification

Suppose:

```text
TRUE AND X
```

can simplify to:

```text
X
```

Or:

```text
FALSE OR X
```

simplifies to:

```text
X
```

You might implement optimization with:

```text
OptimizationVisitor
```

over the Interpreter expression tree.

That's a nice combination of patterns we've learned.

---

# 56. Error handling

Suppose:

```java
context.get("age")
```

returns:

```text
null
```

or a String instead of an integer.

The interpreter needs clear semantics.

Possibilities:

```text
throw evaluation error
return false
return unknown
use default
```

Don't let grammar evaluation silently produce nonsense.

---

# 57. Three-valued logic

Some rule languages need:

```text
TRUE
FALSE
UNKNOWN
```

For example, if:

```text
country
```

is missing.

Then boolean expressions become more sophisticated.

This shows how even a small language can quickly grow in complexity.

---

# 58. Operator precedence

Consider:

```text
2 + 3 * 4
```

Should it mean:

```text
(2 + 3) * 4
```

or:

```text
2 + (3 * 4)
```

Normally multiplication has higher precedence.

This is a **parser concern**.

The Interpreter evaluates the tree it receives.

If the parser builds the wrong tree, the Interpreter faithfully evaluates the wrong meaning.

---

# 59. Parentheses

Similarly:

```text
(2 + 3) * 4
```

must create:

```text
      Multiply
      /      \
    Add       4
   /   \
  2     3
```

Again:

```text
syntax parsing
```

must happen before interpretation.

---

# 60. Interpreter vs simple `if/else`

Suppose you only have:

```java
if (age > 18) {
    ...
}
```

You absolutely do not need:

```text
GreaterThanExpression
VariableExpression
ConstantExpression
RuleContext
InterpreterFactory
```

That would be ridiculous.

Use Interpreter when you actually have:

```text
a configurable language or grammar
```

not one condition.

---

# 61. When Interpreter becomes valuable

Interpreter becomes interesting when rules are:

```text
dynamic
composable
stored/configured
user-defined
recursively structured
```

For example:

```text
(age > 18 AND country == US)
OR
accountType == PREMIUM
```

Now object-based grammar representation becomes more useful.

---

# 62. Configurable rule engine example

Suppose admins define rules:

```text
riskScore > 80
AND
country == "US"
```

Instead of modifying Java code every time, your system could:

```text
parse configuration
build expression tree
evaluate against users
```

That's much closer to a real Interpreter use case.

---

# 63. SQL-like filters

Suppose an internal tool supports:

```text
status = "OPEN"
AND
priority > 5
```

You might build:

```text
AndExpression
├── Equals(status, OPEN)
└── GreaterThan(priority, 5)
```

Then evaluate against records.

Again, useful for a small filter language.

---

# 64. Specification Pattern connection

There's another non-GoF pattern called the **Specification Pattern**.

It often represents rules as composable predicates:

```text
AdultSpecification
AND
UsResidentSpecification
```

This can look very similar to Interpreter.

Difference in emphasis:

```text
Interpreter
→ language/grammar

Specification
→ business rules/predicates
```

Some designs could reasonably be described as either depending on intent.

---

# 65. Interpreter and Predicate

In modern Java, simple rule composition can sometimes use:

```java
Predicate<T>
```

For example:

```java
Predicate<User> adult =
        user ->
            user.age() > 18;

Predicate<User> us =
        user ->
            user.country()
                .equals("US");

Predicate<User> rule =
        adult.and(us);
```

This may be much simpler than classic Interpreter.

So don't force the pattern where functional composition is enough.

---

# 66. Classic Interpreter vs lambdas

Classic Interpreter:

```text
AndExpression
GreaterThanExpression
EqualsExpression
```

Functional approach:

```java
Predicate<User>
```

Classic Interpreter is useful when you need an explicit object tree that can be:

```text
parsed
stored
inspected
serialized
printed
transformed
```

Lambdas are great when you just need executable behavior.

---

# 67. Why explicit expression trees matter

Suppose you need to display:

```text
Current rule:
age > 18 AND country == US
```

or save it to a database.

A structured expression tree is easier to:

```text
serialize
validate
inspect
optimize
edit
visualize
```

than opaque lambdas.

That's a strong reason for Interpreter-style modeling.

---

# 68. Common mistake — mixing parsing and evaluation everywhere

Bad:

```java
class AddExpression {

    void interpret(
            String rawSource) {

        // tokenize
        // parse
        // evaluate
    }
}
```

Keep responsibilities separate:

```text
Lexer
→ tokens

Parser
→ expression tree

Interpreter
→ evaluation
```

Much cleaner.

---

# 69. Common mistake — giant `Expression` class

Bad:

```java
class Expression {

    ExpressionType type;

    Expression left;
    Expression right;

    int value;

    int interpret() {

        switch (type) {

            case NUMBER:
                ...

            case ADD:
                ...

            case MULTIPLY:
                ...

            case AND:
                ...
        }
    }
}
```

This can work, but you've centralized all grammar behavior into a giant type switch.

Polymorphic expression classes are often cleaner for an OO Interpreter design.

---

# 70. Common mistake — using Interpreter for a full language

If requirements include:

```text
functions
loops
variables
scope
exceptions
modules
classes
types
```

classic Interpreter may become difficult to manage.

Use proper compiler/interpreter architecture and tooling.

Patterns aren't substitutes for domain-specific engineering.

---

# 71. Common mistake — mutable shared Context

If multiple threads interpret rules against the same mutable Context:

```java
context.set(...)
```

you may create race conditions.

Prefer per-evaluation Contexts or immutable input objects when possible.

---

# 72. Common mistake — grammar mixed with business infrastructure

Bad:

```java
class AndExpression {

    Database database;
    EmailService emailService;
    KafkaProducer producer;
}
```

Expression nodes should generally focus on language semantics.

External side effects should be separated unless the language explicitly represents actions.

---

# 73. Common mistake — no grammar definition

If you're building a DSL, write down its grammar.

For example:

```text
rule :=
    comparison
    | "(" rule ")"
    | rule AND rule
    | rule OR rule

comparison :=
    identifier "==" value
    | identifier ">" number
```

Without a clear grammar, parser and Interpreter behavior becomes inconsistent.

---

# 74. Common mistake — ambiguous semantics

What does:

```text
A AND B OR C
```

mean?

Is it:

```text
(A AND B) OR C
```

or:

```text
A AND (B OR C)
```

Your grammar needs precedence and associativity rules.

Language design requires precision.

---

# 75. Recognition clues

Think Interpreter when requirements say:

```text
"We have a small language."

"We need configurable expressions."

"We have grammar rules."

"We need to evaluate user-defined filters."

"We want to represent expressions
as an object tree."

"We need terminal and non-terminal
expressions."

"We have a small DSL."

"We need recursive expression evaluation."
```

The strongest recognition question is:

> **Are we representing and evaluating a small grammar or domain-specific language?**

If yes, Interpreter may be appropriate.

---

# 76. Interview answer

If asked:

> What is the Interpreter Pattern?

A strong answer is:

> Interpreter is a behavioral design pattern used to represent the grammar of a small language as an object structure. Grammar rules are modeled as expression classes, where terminal expressions represent basic symbols or values and non-terminal expressions combine other expressions. The resulting expression tree can then be interpreted recursively using a context.

Then give an example:

> An arithmetic interpreter can represent numbers, addition, and multiplication as `NumberExpression`, `AddExpression`, and `MultiplyExpression`, and evaluate an expression tree recursively.

---

# 77. Terminal vs non-terminal interview answer

A strong answer:

> Terminal expressions represent the basic indivisible elements of the grammar, such as numbers, variables, or literals. Non-terminal expressions represent grammar rules composed of other expressions, such as addition, boolean AND, or multiplication.

Example:

```text
NumberExpression
→ terminal

AddExpression
→ non-terminal
```

---

# 78. Interpreter vs Composite interview answer

> Interpreter often uses a Composite-like tree structure, but Composite's goal is to model part-whole hierarchies, while Interpreter's goal is to represent and evaluate grammar rules.

Memory shortcut:

```text
Composite
= tree

Interpreter
= language tree
```

---

# 79. Interpreter vs Visitor interview answer

> Interpreter usually places evaluation behavior inside expression classes through methods such as `interpret()`, while Visitor keeps operations external and dispatches them across node types. Visitor is useful when the same syntax tree needs many different operations beyond interpretation.

---

# 80. Interpreter vs Strategy interview answer

> Strategy encapsulates one of several interchangeable algorithms, while Interpreter models a grammar as a recursive expression structure and evaluates sentences in that grammar.

---

# 81. Mental model

Remember:

```text
Grammar
   ↓
Expression objects
   ↓
Expression tree
   ↓
interpret(context)
   ↓
Result
```

Or:

```text
          AND
         /   \
      rule   rule
       |      |
       v      v
 terminal   terminal
```

Each node knows how to interpret itself.

The simplest phrase is:

> **Interpreter = grammar represented as objects.**

---

# All 11 Behavioral Patterns complete

You have now covered:

```text
Strategy
Observer
Command
State
Template Method
Chain of Responsibility
Iterator
Mediator
Memento
Visitor
Interpreter
```

That means:

```text
Creational:  5 / 5
Structural:  7 / 7
Behavioral: 11 / 11
```

# **23 / 23 GoF patterns complete**

You now know all classic Gang of Four design patterns.

A compact summary of the entire behavioral group:

| Pattern | Main idea |
|---|---|
| Strategy | Swap algorithms |
| Observer | Notify subscribers |
| Command | Turn requests into objects |
| State | Behavior follows lifecycle state |
| Template Method | Fixed workflow, customizable steps |
| Chain of Responsibility | Pass requests through handlers |
| Iterator | Traverse without exposing representation |
| Mediator | Centralize peer coordination |
| Memento | Snapshot and restore |
| Visitor | Add operations across element types |
| Interpreter | Represent grammar as objects |

And the complete 23-pattern mental map is now:

```text
CREATIONAL
Factory Method
→ create through overridable factory

Abstract Factory
→ create compatible families

Builder
→ assemble complex object

Prototype
→ copy configured object

Singleton
→ one controlled instance


STRUCTURAL
Adapter
→ translate interface

Decorator
→ add behavior

Facade
→ simplify subsystem

Composite
→ tree structure

Proxy
→ control access

Bridge
→ separate dimensions

Flyweight
→ share repeated state


BEHAVIORAL
Strategy
→ interchangeable behavior

Observer
→ notification

Command
→ action object

State
→ lifecycle

Template Method
→ algorithm skeleton

Chain
→ handler pipeline

Iterator
→ traversal

Mediator
→ coordination

Memento
→ snapshot

Visitor
→ operations across types

Interpreter
→ grammar evaluation
```

# Next: Lesson 30 — How to Choose the Right Design Pattern

This is the lesson that makes the previous 29 lessons actually useful.

Because the difficult interview question is rarely:

> “Explain Strategy.”

It's more often:

> “Here is a problem. Design it.”

And nobody tells you:

```text
Use Strategy.
Use State.
Use Factory.
```

You have to recognize the design pressure yourself.

So Lesson 30 should focus on **pattern selection and pattern confusion**, including:

```text
Strategy vs State
Decorator vs Proxy
Adapter vs Facade
Factory Method vs Abstract Factory
Builder vs Factory
Bridge vs Strategy
Observer vs Mediator
Observer vs Chain
Command vs Strategy
Command vs Memento
Composite vs Visitor
Iterator vs Visitor
Template Method vs Strategy
Flyweight vs Prototype
```

We'll also learn a much more important rule:

> **Start from the problem and changing requirements—not from the pattern name.**

That will be our bridge from **memorizing design patterns** into actual **Low-Level Design problem solving**.
