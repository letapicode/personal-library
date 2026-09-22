# Lesson 28 — Visitor Pattern

The **Visitor Pattern** is used when you have a stable object structure containing different concrete types, but you frequently need to add **new operations** across those types.

The core idea is:

> Move operations out of the object hierarchy and into separate Visitor objects.

Instead of continuously adding methods like:

```java
calculateTax();
export();
audit();
generateReport();
```

to every domain class, we let those objects accept a Visitor.

---

# 1. Start with the problem

Imagine a shopping cart containing different item types:

```text
ShoppingCart
├── Book
├── Electronics
├── Grocery
└── Subscription
```

Each item has different rules.

For example:

```text
Book
→ special tax rule

Electronics
→ electronics tax + shipping

Grocery
→ reduced tax

Subscription
→ no physical shipping
```

Initially, perhaps we need only:

```java
double getPrice();
```

So:

```java
interface CartItem {

    double getPrice();
}
```

Implementations:

```java
class Book
        implements CartItem {

    private final double price;

    public Book(double price) {
        this.price = price;
    }

    @Override
    public double getPrice() {
        return price;
    }
}
```

Simple enough.

---

# 2. Then new operations arrive

Now requirements say:

```text
calculate tax
calculate shipping
generate invoice text
audit items
export JSON
```

One approach is to add all of these methods to `CartItem`:

```java
interface CartItem {

    double getPrice();

    double calculateTax();

    double calculateShipping();

    String exportJson();

    void audit();

    String invoiceDescription();
}
```

Every item class keeps growing.

---

# 3. Why this becomes a problem

Suppose we have:

```text
4 item types
```

and keep adding new operations.

Every new operation requires changes to:

```text
Book
Electronics
Grocery
Subscription
```

The object hierarchy becomes overloaded with behavior that may not belong to its core responsibility.

For example:

```java
class Book {

    double calculateTax() {}

    double calculateShipping() {}

    String exportJson() {}

    String exportXml() {}

    void audit() {}

    String generateAccountingReport() {}
}
```

`Book` now understands:

```text
tax
shipping
serialization
auditing
reporting
accounting
```

That's a lot of unrelated responsibilities.

---

# 4. Visitor asks a different question

Instead of asking:

> How do I put all operations inside `Book`?

Visitor asks:

> Can `Book` expose itself to an operation object that knows how to process books?

So we introduce:

```java
interface CartItemVisitor {

    void visit(Book book);

    void visit(Electronics electronics);

    void visit(Grocery grocery);

    void visit(Subscription subscription);
}
```

Each operation becomes a Visitor.

---

# 5. Add `accept()`

Our element interface becomes:

```java
interface CartItem {

    void accept(
        CartItemVisitor visitor
    );
}
```

Each concrete item implements it.

Book:

```java
class Book
        implements CartItem {

    private final double price;

    public Book(double price) {
        this.price = price;
    }

    public double getPrice() {
        return price;
    }

    @Override
    public void accept(
            CartItemVisitor visitor) {

        visitor.visit(this);
    }
}
```

Electronics:

```java
class Electronics
        implements CartItem {

    private final double price;

    public Electronics(double price) {
        this.price = price;
    }

    public double getPrice() {
        return price;
    }

    @Override
    public void accept(
            CartItemVisitor visitor) {

        visitor.visit(this);
    }
}
```

The interesting line is:

```java
visitor.visit(this);
```

We'll come back to why that's important.

---

# 6. Tax Visitor

Now tax calculation lives outside the item classes.

```java
class TaxVisitor
        implements CartItemVisitor {

    private double totalTax;

    @Override
    public void visit(
            Book book) {

        totalTax +=
            book.getPrice() * 0.05;
    }

    @Override
    public void visit(
            Electronics electronics) {

        totalTax +=
            electronics.getPrice()
            * 0.10;
    }

    @Override
    public void visit(
            Grocery grocery) {

        totalTax +=
            grocery.getPrice()
            * 0.02;
    }

    @Override
    public void visit(
            Subscription subscription) {

        totalTax +=
            subscription.getPrice()
            * 0.08;
    }

    public double getTotalTax() {
        return totalTax;
    }
}
```

Usage:

```java
TaxVisitor taxVisitor =
        new TaxVisitor();

for (CartItem item : items) {
    item.accept(taxVisitor);
}

System.out.println(
    taxVisitor.getTotalTax()
);
```

---

# 7. Add another operation

Suppose we now need shipping cost.

Instead of modifying:

```text
Book
Electronics
Grocery
Subscription
```

we create another Visitor.

```java
class ShippingVisitor
        implements CartItemVisitor {

    private double totalShipping;

    @Override
    public void visit(
            Book book) {

        totalShipping += 3.0;
    }

    @Override
    public void visit(
            Electronics electronics) {

        totalShipping += 15.0;
    }

    @Override
    public void visit(
            Grocery grocery) {

        totalShipping += 5.0;
    }

    @Override
    public void visit(
            Subscription subscription) {

        // digital product
        totalShipping += 0;
    }

    public double
        getTotalShipping() {

        return totalShipping;
    }
}
```

Notice:

> We added a completely new operation without modifying existing item classes.

That's Visitor's major strength.

---

# 8. Structure

The pattern usually contains:

### Element

```java
interface CartItem {

    void accept(
        CartItemVisitor visitor
    );
}
```

### Concrete Elements

```text
Book
Electronics
Grocery
Subscription
```

### Visitor

```java
interface CartItemVisitor {

    void visit(Book book);

    void visit(Electronics electronics);

    void visit(Grocery grocery);

    void visit(Subscription subscription);
}
```

### Concrete Visitors

```text
TaxVisitor
ShippingVisitor
ExportVisitor
AuditVisitor
```

Conceptually:

```text
             Visitor
          /     |      \
         /      |       \
      Tax    Shipping   Export
         \      |       /
          \     |      /
           Elements
      /      |       \
    Book  Grocery  Electronics
```

---

# 9. Why not just use polymorphism normally?

Suppose:

```java
CartItem item =
        new Book(...);
```

If we call:

```java
item.calculateTax();
```

normal polymorphism chooses implementation based on the runtime type of:

```text
item
```

That's one dispatch.

Visitor introduces something more interesting.

---

# 10. Double dispatch

Visitor is famous for:

> **Double dispatch**

Let's understand it carefully.

We call:

```java
item.accept(visitor);
```

First dispatch:

> Which concrete element's `accept()` runs?

If `item` is actually a `Book`, Java executes:

```java
Book.accept(visitor)
```

Inside:

```java
visitor.visit(this);
```

Since `this` is statically known inside `Book` as a `Book`, Java selects:

```java
visit(Book book)
```

Then normal dynamic dispatch chooses which concrete Visitor implementation runs.

So behavior effectively depends on both:

```text
concrete Element type
+
concrete Visitor type
```

That's why we call it double dispatch.

---

# 11. Why do we need `accept()`?

You might ask:

> Why can't I just do `visitor.visit(item)`?

Suppose:

```java
CartItem item =
        new Book(...);

visitor.visit(item);
```

But the compiler sees:

```java
CartItem
```

as the static type.

Java method overloading is resolved primarily at compile time.

If there isn't:

```java
visit(CartItem item)
```

this won't select:

```java
visit(Book book)
```

just because the runtime object happens to be a Book.

`accept()` solves that problem.

---

# 12. The key trick

Inside:

```java
class Book {

    public void accept(
            CartItemVisitor visitor) {

        visitor.visit(this);
    }
}
```

`this` is known as:

```java
Book
```

Therefore:

```java
visit(Book)
```

gets selected.

For Electronics:

```java
class Electronics {

    public void accept(
            CartItemVisitor visitor) {

        visitor.visit(this);
    }
}
```

now:

```java
visit(Electronics)
```

gets selected.

That is the key mechanism.

---

# 13. Double dispatch step-by-step

Suppose:

```java
CartItem item =
        new Book(20);

CartItemVisitor visitor =
        new TaxVisitor();
```

Call:

```java
item.accept(visitor);
```

Step 1:

Runtime dispatch based on `item`:

```text
CartItem
actually Book
→ Book.accept()
```

Inside Book:

```java
visitor.visit(this);
```

Step 2:

`this` is a `Book`, so overloaded method selected:

```java
visit(Book)
```

Then the actual visitor object is:

```text
TaxVisitor
```

so:

```java
TaxVisitor.visit(Book)
```

executes.

This is the heart of Visitor.

---

# 14. A simpler conceptual model

You can think of:

```java
book.accept(taxVisitor);
```

as meaning:

> Book, introduce yourself to the tax operation.

The Book says:

```text
"I am a Book."
```

Then `TaxVisitor` applies the Book-specific tax behavior.

---

# 15. Why Visitor is useful

Suppose element types are stable:

```text
Book
Electronics
Grocery
Subscription
```

but operations keep growing:

```text
Tax
Shipping
Audit
Export
Insurance
Report
Analytics
```

Visitor makes this easy.

Each new operation becomes:

```java
class NewOperationVisitor
        implements CartItemVisitor {
    ...
}
```

Existing element classes stay unchanged.

---

# 16. The tradeoff matrix

Visitor has a very distinctive tradeoff.

If you have:

```text
stable element types
frequently changing operations
```

Visitor is excellent.

But if you frequently add new element types, Visitor becomes painful.

Why?

Suppose we add:

```text
Furniture
```

Now Visitor interface must change:

```java
void visit(Furniture furniture);
```

And every concrete Visitor must implement it:

```text
TaxVisitor
ShippingVisitor
AuditVisitor
ExportVisitor
...
```

So:

> Adding operations is easy.  
> Adding element types is expensive.

This is probably the most important Visitor tradeoff.

---

# 17. Compare with normal OOP

Traditional polymorphism makes it easy to add new subclasses.

Suppose:

```java
interface Shape {

    double area();
}
```

Adding:

```java
class Triangle
        implements Shape
```

is easy.

Existing classes don't change.

But adding a new operation:

```text
exportToSvg()
```

requires changing the interface and potentially all classes.

Visitor flips that tradeoff.

---

# 18. The expression problem

This broader design tension is sometimes called the:

> **Expression Problem**

You often want both:

```text
easy to add new data types
AND
easy to add new operations
```

but traditional OO designs tend to favor one direction.

Normal polymorphism:

```text
new subtype = easy
new operation = harder
```

Visitor:

```text
new operation = easy
new subtype = harder
```

This is a deep design insight.

---

# 19. Better real-world example — compiler AST

Visitor becomes much more natural in compilers.

Imagine an Abstract Syntax Tree:

```text
Expression
├── NumberExpression
├── AddExpression
├── MultiplyExpression
└── VariableExpression
```

The structure of expression node types may be relatively stable.

But we want many operations:

```text
evaluate
pretty print
type check
optimize
generate bytecode
collect variables
```

This is excellent Visitor territory.

---

# 20. AST Element interface

```java
interface Expression {

    <R> R accept(
        ExpressionVisitor<R> visitor
    );
}
```

Visitor:

```java
interface ExpressionVisitor<R> {

    R visitNumber(
        NumberExpression expression
    );

    R visitAdd(
        AddExpression expression
    );

    R visitMultiply(
        MultiplyExpression expression
    );
}
```

We're using generics so a Visitor can return a result.

---

# 21. Number expression

```java
class NumberExpression
        implements Expression {

    private final int value;

    public NumberExpression(
            int value) {

        this.value = value;
    }

    public int getValue() {
        return value;
    }

    @Override
    public <R> R accept(
            ExpressionVisitor<R>
                    visitor) {

        return visitor.visitNumber(
            this
        );
    }
}
```

---

# 22. Add expression

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

    public Expression getLeft() {
        return left;
    }

    public Expression getRight() {
        return right;
    }

    @Override
    public <R> R accept(
            ExpressionVisitor<R>
                    visitor) {

        return visitor.visitAdd(
            this
        );
    }
}
```

---

# 23. Evaluation Visitor

```java
class EvaluationVisitor
        implements
        ExpressionVisitor<Integer> {

    @Override
    public Integer visitNumber(
            NumberExpression expression) {

        return expression.getValue();
    }

    @Override
    public Integer visitAdd(
            AddExpression expression) {

        int left =
            expression
                .getLeft()
                .accept(this);

        int right =
            expression
                .getRight()
                .accept(this);

        return left + right;
    }

    @Override
    public Integer visitMultiply(
            MultiplyExpression expression) {

        int left =
            expression
                .getLeft()
                .accept(this);

        int right =
            expression
                .getRight()
                .accept(this);

        return left * right;
    }
}
```

Now we can evaluate the entire AST.

---

# 24. Build an expression

Let's represent:

```text
2 + (3 × 4)
```

Code:

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
int result =
        expression.accept(
            new EvaluationVisitor()
        );
```

Result:

```text
14
```

---

# 25. Add pretty printing

Now we need:

```text
2 + (3 * 4)
```

Do we modify every AST node?

No.

Create:

```java
class PrettyPrintVisitor
        implements
        ExpressionVisitor<String> {

    @Override
    public String visitNumber(
            NumberExpression expression) {

        return Integer.toString(
            expression.getValue()
        );
    }

    @Override
    public String visitAdd(
            AddExpression expression) {

        return "("
            + expression
                .getLeft()
                .accept(this)
            + " + "
            + expression
                .getRight()
                .accept(this)
            + ")";
    }

    @Override
    public String visitMultiply(
            MultiplyExpression expression) {

        return "("
            + expression
                .getLeft()
                .accept(this)
            + " * "
            + expression
                .getRight()
                .accept(this)
            + ")";
    }
}
```

No AST classes changed.

That's exactly Visitor's strength.

---

# 26. Add type checking

Later:

```java
class TypeCheckingVisitor
        implements
        ExpressionVisitor<Type> {
    ...
}
```

Then:

```text
EvaluationVisitor
PrettyPrintVisitor
TypeCheckingVisitor
OptimizationVisitor
CodeGenerationVisitor
```

all operate over the same AST structure.

This is why compilers are one of the strongest real-world Visitor examples.

---

# 27. Visitor + Composite

Notice our AST structure:

```text
AddExpression
    |
    +--> left Expression
    |
    +--> right Expression
```

This is also a Composite-like tree.

So:

```text
Composite
→ models the recursive tree

Visitor
→ performs operations across the tree
```

These patterns pair extremely well.

---

# 28. Visitor + Iterator

Iterator asks:

> How do we traverse?

Visitor asks:

> What do we do when we reach each element?

For example:

```text
Iterator
→ DFS through file tree

Visitor
→ calculate total size
```

Or:

```text
Iterator
→ walk AST

Visitor
→ pretty print nodes
```

Memory shortcut:

```text
Iterator = movement

Visitor = operation
```

---

# 29. Visitor can traverse itself

In the AST example, the Visitor itself recursively calls:

```java
child.accept(this);
```

So Visitor may own traversal as part of the operation.

That's common.

Visitor does not require a separate Iterator.

---

# 30. Visitor vs Strategy

Strategy represents one interchangeable algorithm used by a context.

Example:

```text
PaymentStrategy
├── Card
├── PayPal
└── Crypto
```

Visitor represents an operation over several concrete element types.

Example:

```text
TaxVisitor
visits:
Book
Electronics
Grocery
Subscription
```

So:

```text
Strategy
= choose one behavior for a context

Visitor
= apply one operation across heterogeneous types
```

---

# 31. Visitor vs Command

Command represents:

> An action/request as an object.

Visitor represents:

> An operation over an object structure.

Command:

```text
DeleteFileCommand
```

Visitor:

```text
FileSizeVisitor
```

One packages an action.

The other performs type-specific work across elements.

---

# 32. Visitor vs Decorator

Decorator adds behavior around one object while preserving its interface.

Visitor adds external operations to a whole hierarchy.

Decorator:

```text
Service
→ LoggingDecorator
→ RetryDecorator
```

Visitor:

```text
Visitor
→ visit(Book)
→ visit(Grocery)
→ visit(Electronics)
```

Different problem entirely.

---

# 33. Visitor vs Template Method

Template Method says:

> The algorithm skeleton is fixed; subclasses customize steps.

Visitor says:

> Keep data objects relatively stable; put operations in external Visitor classes.

Template Method uses inheritance inside an operation family.

Visitor organizes cross-cutting operations over an object hierarchy.

---

# 34. Visitor vs State

State changes behavior according to current lifecycle.

Visitor changes operation according to concrete element type.

State:

```text
Order
→ PaidState
```

Visitor:

```text
TaxVisitor
→ Book
→ Electronics
```

Different axes entirely.

---

# 35. Visitor and OCP

Visitor supports OCP strongly for **new operations**.

Suppose we add:

```java
class InsuranceVisitor
        implements CartItemVisitor {
    ...
}
```

Existing:

```text
Book
Electronics
Grocery
Subscription
```

stay unchanged.

But adding a new **element type** violates the easy-extension direction.

So Visitor supports OCP along one dimension, not magically along every dimension.

---

# 36. Visitor and SRP

Without Visitor:

```java
class Book {

    calculateTax();
    calculateShipping();
    export();
    audit();
    insure();
}
```

With Visitor:

```text
Book
→ Book data/domain behavior

TaxVisitor
→ tax rules

ShippingVisitor
→ shipping rules

ExportVisitor
→ export rules
```

This can greatly improve responsibility separation.

---

# 37. Visitor and coupling

There's a tradeoff.

Visitor separates operations from Elements, but Visitor must know every concrete Element type.

For example:

```java
interface CartItemVisitor {

    void visit(Book book);

    void visit(Electronics electronics);
}
```

So Visitors are tightly coupled to the element hierarchy.

That's intentional.

Visitor is best when that hierarchy is stable.

---

# 38. Visitor can require exposing data

Suppose:

```java
TaxVisitor.visit(Book book)
```

needs:

```text
price
category
publication type
country
```

The Book may need getters exposing that state.

This can weaken encapsulation.

That's another Visitor tradeoff.

Sometimes Visitors need privileged or package-level access.

---

# 39. Don't expose everything blindly

Bad:

```java
public InternalBookData
        getEverything() {
    ...
}
```

just so Visitors can work.

Prefer exposing meaningful domain data:

```java
book.getPrice();
book.getCategory();
```

Visitor should not force the domain model to abandon encapsulation entirely.

---

# 40. Stateful Visitors

A Visitor can accumulate state.

Our `TaxVisitor` did:

```java
private double totalTax;
```

Other examples:

```text
total size
node count
list of errors
set of variables
generated output
```

Visitor doesn't have to be stateless.

---

# 41. Returning values instead of mutable accumulation

We can also design Visitors with return values.

For example:

```java
interface ItemVisitor<R> {

    R visit(Book book);

    R visit(Grocery grocery);
}
```

Then:

```java
double tax =
        item.accept(
            new TaxVisitor()
        );
```

This is often cleaner when one element returns one result.

For aggregating across many elements, either approach works.

---

# 42. Generic Visitor

A generic visitor interface can be:

```java
interface Visitor<R> {

    R visit(Book book);

    R visit(Electronics electronics);

    R visit(Grocery grocery);
}
```

Elements:

```java
interface CartItem {

    <R> R accept(
        Visitor<R> visitor
    );
}
```

This is a nice modern Java design.

---

# 43. Example export Visitor

```java
class JsonExportVisitor
        implements Visitor<String> {

    @Override
    public String visit(
            Book book) {

        return """
            {
              "type": "book",
              "price": %s
            }
            """.formatted(
                book.getPrice()
            );
    }

    @Override
    public String visit(
            Electronics electronics) {

        return """
            {
              "type": "electronics",
              "price": %s
            }
            """.formatted(
                electronics.getPrice()
            );
    }

    // ...
}
```

Again, export logic lives outside domain classes.

---

# 44. Visitor over a file system

Suppose Composite gives us:

```text
FileSystemNode
├── File
└── Folder
```

We may want operations:

```text
calculate size
count files
search extensions
generate report
check permissions
```

Visitor can provide:

```text
SizeVisitor
SearchVisitor
PermissionVisitor
```

while `File` and `Folder` stay focused on the structure.

---

# 45. File-system Visitor interface

```java
interface FileSystemVisitor<R> {

    R visitFile(
        FileNode file
    );

    R visitFolder(
        FolderNode folder
    );
}
```

Each node:

```java
interface FileSystemNode {

    <R> R accept(
        FileSystemVisitor<R>
                visitor
    );
}
```

This is a very natural Composite + Visitor combination.

---

# 46. Database schema example

Suppose schema elements include:

```text
Table
Column
Index
Constraint
```

Operations include:

```text
generate SQL
validate schema
generate documentation
calculate migration plan
```

Visitor can work well if schema element types are stable but operations keep growing.

---

# 47. Document structure example

Imagine:

```text
Document
├── Paragraph
├── Image
├── Table
└── Link
```

Operations:

```text
render HTML
render PDF
spell check
extract text
accessibility audit
```

Visitor can be useful when those operations are numerous and elements are relatively stable.

---

# 48. When Visitor is a bad fit

Suppose you're frequently adding new domain types:

```text
Book
Electronics
Grocery
Furniture
Medicine
Automobile
Insurance
Flight
Hotel
...
```

Every time you add one, you must modify:

```text
Visitor interface
TaxVisitor
ShippingVisitor
ExportVisitor
AuditVisitor
...
```

That's painful.

Visitor is not ideal if the element hierarchy evolves rapidly.

---

# 49. Another bad fit: operation belongs naturally to the object

Suppose:

```java
book.getTitle();
```

or:

```java
account.withdraw();
```

These are core domain behaviors.

Don't move every method into a Visitor.

Visitor is most useful for operations that cut across multiple element types and are somewhat external to their essential identity.

---

# 50. Another bad fit: only one simple operation

If you have:

```text
3 element classes
1 operation
```

Visitor may be unnecessary complexity.

A normal method or service may be clearer.

Don't introduce double dispatch just because the pattern exists.

---

# 51. Visitor can create large interfaces

Suppose:

```text
100 element types
```

Then:

```java
interface Visitor {

    visit(Type1 x);
    visit(Type2 x);
    ...
    visit(Type100 x);
}
```

That's large.

This is manageable in compilers sometimes because the node set is explicit and stable.

In rapidly changing business domains, it can be unpleasant.

---

# 52. Default Visitor methods

You might be tempted to do:

```java
interface Visitor {

    default void visit(Book book) {}

    default void visit(Grocery grocery) {}

    ...
}
```

This reduces implementation burden.

But it also makes it easier to forget support for a new element type.

Sometimes compile-time errors are exactly what you want.

A strict Visitor interface forces every Visitor to consider every element type.

---

# 53. Compile-time exhaustiveness benefit

Suppose we add:

```text
Furniture
```

and change:

```java
interface CartItemVisitor {

    void visit(Furniture furniture);
}
```

Now Java reports errors in:

```text
TaxVisitor
ShippingVisitor
ExportVisitor
```

until they implement the new method.

That pain can actually be useful.

It forces us to answer:

```text
How should Furniture be taxed?
How should it be shipped?
How should it be exported?
```

So the downside can also provide strong completeness checks.

---

# 54. Visitor and Java pattern matching

Modern Java has more powerful pattern matching than older versions.

Sometimes you can write:

```java
switch (item) {
    case Book book ->
        ...
    case Electronics electronics ->
        ...
    case Grocery grocery ->
        ...
}
```

For small sealed hierarchies, this can sometimes replace classic Visitor boilerplate.

But conceptually, you're still centralizing type-specific operations.

Visitor remains useful when you want:

```text
many reusable operations
double-dispatch structure
separate operation objects
stateful traversals
```

---

# 55. Sealed hierarchies change the tradeoff

Suppose:

```java
sealed interface Expression
        permits NumberExpression,
                AddExpression,
                MultiplyExpression {
}
```

A pattern-matching `switch` can provide exhaustive handling.

For some modern Java code, that may be simpler than Visitor.

But Visitor still has advantages when operations are large objects with dependencies/state.

So this is a case where language evolution can reduce the need for a classic GoF pattern.

---

# 56. Visitor with dependencies

Suppose:

```java
class AuditVisitor
        implements CartItemVisitor {

    private final AuditRepository
            repository;

    private final Clock clock;
}
```

That's fine.

Visitors can be full application objects with dependencies.

They are not limited to pure functions.

---

# 57. Visitor and traversal order

Visitor itself doesn't inherently define traversal order.

For a tree, either:

```text
the elements call visitor recursively
```

or:

```text
visitor recursively traverses children
```

or:

```text
an Iterator traverses the structure,
then Visitor processes each element
```

These are design choices.

Visitor focuses primarily on the operation, not traversal policy.

---

# 58. Pre-order vs post-order visits

In a tree, an operation may need:

```text
visit parent before children
```

or:

```text
visit children before parent
```

For example:

```text
pretty printing
→ often pre-order-ish

computing aggregate size
→ often post-order-ish
```

The Visitor design should make traversal semantics explicit.

---

# 59. Visitor and recursion

For Composite structures, Visitors often recurse.

Example:

```java
@Override
public Integer visitFolder(
        FolderNode folder) {

    int total = 0;

    for (FileSystemNode child
            : folder.getChildren()) {

        total += child.accept(this);
    }

    return total;
}
```

The Visitor accumulates a result across the tree.

---

# 60. Visitor can modify objects

Visitors are not necessarily read-only.

A Visitor could:

```text
normalize
optimize
rewrite
annotate
```

objects.

For example, a compiler optimization Visitor may replace:

```text
2 + 3
```

with:

```text
5
```

But mutation increases complexity, so be deliberate.

---

# 61. Read-only vs mutating Visitors

Read-only examples:

```text
TaxVisitor
PrettyPrintVisitor
StatisticsVisitor
```

Mutating examples:

```text
OptimizationVisitor
NormalizationVisitor
MigrationVisitor
```

If Visitors mutate elements, document that clearly.

---

# 62. Common mistake — Visitor with `instanceof`

Bad:

```java
class TaxVisitor {

    void visit(CartItem item) {

        if (item instanceof Book) {
            ...
        } else if (
            item instanceof Grocery) {
            ...
        }
    }
}
```

This can work, but it throws away Visitor's double-dispatch structure.

If your Visitor is just one large type switch, ask whether you really need the pattern.

---

# 63. Common mistake — generic `visit(Object)`

Bad:

```java
void visit(Object object)
```

Now the Visitor needs runtime type checks.

The classic Visitor pattern gets its power from overloaded type-specific methods:

```java
visit(Book)
visit(Grocery)
visit(Electronics)
```

---

# 64. Common mistake — adding `accept()` where hierarchy isn't stable

If your domain model changes constantly, making every class participate in Visitor may create lots of maintenance overhead.

Choose Visitor based on expected change direction.

Ask:

> What changes more often — element types or operations?

That's the key architectural question.

---

# 65. Common mistake — operations that require private internals

If Visitors need dozens of getters exposing implementation details, you may be weakening encapsulation too much.

Sometimes the operation belongs in the class after all.

Visitor isn't automatically better than methods on the element.

---

# 66. Common mistake — Visitors doing unrelated orchestration

Bad:

```java
class TaxVisitor {

    void visit(Book book) {

        sendEmail();
        updateDatabase();
        chargePayment();
        publishEvent();
    }
}
```

A Visitor should usually represent one cohesive operation.

Keep the Visitor responsibility focused.

---

# 67. Recognition clues

Think Visitor when requirements sound like:

```text
"We have a stable hierarchy
of different object types."

"We keep adding new operations
across all those types."

"We don't want every class to gain
methods for reporting/exporting/auditing."

"Operations depend on the concrete
element type."

"We need double dispatch."

"We're working with ASTs,
syntax trees, document trees,
or other stable structures."
```

The strongest recognition question is:

> **Are the element types relatively stable while new operations over those types are added frequently?**

If yes, Visitor is a strong candidate.

---

# 68. Interview answer

If asked:

> What is the Visitor Pattern?

A strong answer is:

> Visitor is a behavioral design pattern that lets you add new operations to an existing object structure without modifying the element classes. Each element implements an `accept(visitor)` method, and the Visitor provides overloaded `visit()` methods for each concrete element type. This enables double dispatch, where behavior depends on both the concrete element type and the concrete Visitor.

Then give the AST example:

> A compiler AST can remain stable while separate Visitors perform evaluation, pretty printing, type checking, optimization, and code generation.

---

# 69. Double-dispatch interview answer

A strong answer:

> Java normally uses single dynamic dispatch, where the runtime method implementation depends on the receiver type. Visitor achieves double-dispatch-like behavior by first dynamically selecting the element's `accept()` method and then calling a type-specific `visitor.visit(this)`, which selects behavior based on both element type and Visitor type.

That's a very strong interview explanation.

---

# 70. Visitor vs Iterator interview answer

> Iterator controls how elements are traversed, while Visitor encapsulates an operation performed on elements, often with different logic for different concrete element types.

Memory shortcut:

```text
Iterator = WHERE/NEXT

Visitor = WHAT TO DO
```

---

# 71. Visitor vs Strategy interview answer

> Strategy encapsulates interchangeable algorithms used by a context, while Visitor encapsulates operations across a heterogeneous object structure and typically provides type-specific behavior for each concrete element.

---

# 72. Visitor vs normal polymorphism

A useful way to remember:

Normal polymorphism organizes by:

```text
object type
```

For example:

```text
Book.calculateTax()
Grocery.calculateTax()
```

Visitor organizes by:

```text
operation
```

For example:

```text
TaxVisitor
├── Book tax
├── Grocery tax
└── Electronics tax
```

That is the real organizational shift.

---

# 73. The matrix view

Imagine a matrix:

| | Book | Grocery | Electronics |
|---|---|---|---|
| Tax | rule | rule | rule |
| Shipping | rule | rule | rule |
| Export | rule | rule | rule |

Traditional OO tends to organize by **columns**:

```text
Book
→ tax
→ shipping
→ export
```

Visitor organizes by **rows**:

```text
TaxVisitor
→ Book
→ Grocery
→ Electronics
```

This is one of the clearest ways to understand Visitor.

---

# 74. The big tradeoff

Traditional OO:

```text
easy to add new element type
harder to add operation
```

Visitor:

```text
easy to add new operation
harder to add element type
```

Neither is universally better.

Choose based on which dimension changes more often.

---

# 75. Mental model

Remember:

```text
Element
   |
   | accept
   v
Visitor
   |
   +--> visit(Book)
   +--> visit(Grocery)
   +--> visit(Electronics)
```

The Element says:

> Here's what concrete type I am.

The Visitor says:

> I know what this operation means for that type.

The simplest phrase is:

> **Visitor = add operations without stuffing them into the element hierarchy.**

---

# Behavioral patterns so far

We've now covered:

```text
Strategy
→ interchangeable algorithms

Observer
→ notify subscribers

Command
→ package actions

State
→ lifecycle-dependent behavior

Template Method
→ fixed algorithm skeleton

Chain of Responsibility
→ processing pipeline

Iterator
→ traversal

Mediator
→ centralized coordination

Memento
→ snapshot and restore

Visitor
→ external operations over
  heterogeneous element types
```

A compact mental model:

```text
Strategy        = choose HOW

Observer        = notify WHO

Command         = package WHAT

State           = lifecycle

Template Method = fixed workflow

Chain           = pipeline

Iterator        = traversal

Mediator        = coordination

Memento         = remember state

Visitor         = external operation
                  across types
```

You have now completed:

```text
5 / 5  Creational
7 / 7  Structural
10 / 11 Behavioral
```

So you're at:

# **22 / 23 GoF patterns complete**

Only **one classic GoF pattern remains**.

# Next: Lesson 29 — Interpreter Pattern

Interpreter deals with another interesting problem:

> How do we represent and evaluate a small language or grammar using objects?

For example, suppose we want to interpret expressions like:

```text
1 + 2 * 3
```

or rules like:

```text
age > 18 AND country == "US"
```

or commands like:

```text
MOVE 10
TURN LEFT
MOVE 5
```

We can model grammar elements as objects:

```text
Expression
├── NumberExpression
├── AddExpression
├── AndExpression
└── VariableExpression
```

and then evaluate them recursively.

Lesson 29 will cover **grammar rules, terminal vs non-terminal expressions, expression trees, recursive evaluation, Interpreter vs Composite/Visitor, why Interpreter is useful for small DSLs, and why you usually should not build a full programming language with it**.
