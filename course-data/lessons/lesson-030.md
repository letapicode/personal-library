# Lesson 30 — How to Choose the Right Design Pattern

This lesson is one of the most important ones in the course.

Knowing all 23 GoF patterns is useful.

But real LLD skill is not:

> “I know what Strategy is.”

It is:

> “I can look at a design problem, identify the pressure in the design, and choose an appropriate solution without forcing a pattern.”

The most important rule is:

> **Start from the problem, not from the pattern.**

A strong designer thinks:

```text
What is changing?

What is tightly coupled?

What responsibility is mixed?

What extension is becoming difficult?

What behavior repeats?

What should be hidden?

What should vary independently?
```

Only then do you ask:

```text
Does one of the known patterns fit?
```

---

# 1. The wrong way to use patterns

Suppose you're designing a parking lot.

A weak approach is:

```text
"I learned Factory.
Where can I put a Factory?"

"I learned Observer.
Maybe I need Observer."

"I learned Singleton.
Let's make ParkingLot Singleton."
```

That's pattern-first thinking.

It usually creates unnecessary complexity.

A stronger approach is:

```text
Vehicles vary by type.

Parking allocation rules may vary.

Payment methods may vary.

Pricing rules may vary.

Display boards need updates when spots change.
```

Now patterns may naturally emerge:

```text
Pricing variation
→ Strategy

Display updates
→ Observer, possibly

Object creation complexity
→ Factory, if actually needed
```

The pattern follows the design pressure.

---

# 2. The master recognition map

Before going into the confusing pairs, memorize this higher-level map:

| Design pressure | Pattern to consider |
|---|---|
| Several interchangeable algorithms | Strategy |
| Behavior changes with lifecycle state | State |
| Add responsibilities around an object | Decorator |
| Control access to another object | Proxy |
| Existing interface doesn't match | Adapter |
| Subsystem is too complicated for clients | Facade |
| Need one concrete product chosen at creation | Factory Method |
| Need a compatible family of products | Abstract Factory |
| Complex construction with many options | Builder |
| Two independent dimensions are multiplying subclasses | Bridge |
| One event should notify many listeners | Observer |
| Many peers communicate chaotically | Mediator |
| Request should pass through handlers | Chain of Responsibility |
| Request/action should become an object | Command |
| Need state snapshot/restore | Memento |
| Need hierarchical part-whole structure | Composite |
| Need operations across stable heterogeneous types | Visitor |
| Need traversal without exposing storage | Iterator |
| Same workflow, different steps | Template Method |
| Repeated heavy state across many objects | Flyweight |
| Need copies of preconfigured objects | Prototype |

But this table is only a starting point.

The tricky part is when two patterns look similar.

Let's go through those.

---

# Part I — Strategy vs State

These are probably the most commonly confused behavioral patterns.

Both often look like:

```java
class Context {
    private Behavior behavior;
}
```

And both use:

```text
composition
interfaces
polymorphism
```

So structure alone won't tell you the answer.

The difference is **intent**.

---

# 3. Strategy asks: "How should this operation be performed?"

Examples:

```text
Payment:
Card
PayPal
Crypto

Routing:
Fastest
Shortest
Scenic

Sorting:
MergeSort
QuickSort
HeapSort
```

The Context chooses one behavior.

Example:

```java
class PaymentService {

    private PaymentStrategy strategy;

    public PaymentService(
            PaymentStrategy strategy) {

        this.strategy = strategy;
    }

    public void pay(double amount) {
        strategy.pay(amount);
    }
}
```

The selected algorithm is the variation.

---

# 4. State asks: "How should I behave in my current lifecycle state?"

Examples:

```text
Order:
Created
Paid
Shipped
Delivered

Vending Machine:
NoCoin
HasCoin
Dispensing

Document:
Draft
Review
Approved
Published
```

The current state determines valid behavior.

Example:

```java
class Order {

    private OrderState state;

    public void ship() {
        state.ship(this);
    }
}
```

`ship()` behaves differently depending on whether the Order is:

```text
Created
Paid
Shipped
```

---

# 5. The strongest distinction

Strategy:

```text
Behavior is selected because
we want a particular algorithm.
```

State:

```text
Behavior changes because
the object's lifecycle changed.
```

Ask:

> Is the object choosing a technique, or is it moving through a lifecycle?

If technique:

```text
Strategy
```

If lifecycle:

```text
State
```

---

# 6. Another clue: transitions

Strategy objects usually do not say:

```text
After CardPayment,
become PayPalPayment.
```

State objects often transition:

```text
Created → Paid → Shipped
```

So automatic or domain-driven transitions are a strong State signal.

Memory:

```text
Strategy = algorithm choice
State    = lifecycle transition
```

---

# Part II — Decorator vs Proxy

These two can have almost identical class diagrams.

Both may look like:

```java
interface Service {
    void execute();
}
```

with:

```java
class Wrapper
        implements Service {

    private final Service wrapped;
}
```

So again, intent matters.

---

# 7. Decorator asks: "How can I add behavior?"

Example:

```text
Coffee
→ MilkDecorator
→ SugarDecorator
```

or:

```text
HttpClient
→ LoggingDecorator
→ RetryDecorator
→ MetricsDecorator
```

Decorator enriches the wrapped object.

Example:

```java
class LoggingService
        implements Service {

    private final Service wrapped;

    public void execute() {

        log("before");

        wrapped.execute();

        log("after");
    }
}
```

The intention is:

> Add responsibilities.

---

# 8. Proxy asks: "How can I control access?"

Examples:

```text
Lazy loading
Authorization
Remote access
Caching
Rate limiting
```

Example:

```java
class SecuredServiceProxy
        implements Service {

    private final Service realService;

    public void execute() {

        if (!authorized()) {
            throw new SecurityException();
        }

        realService.execute();
    }
}
```

The intention is:

> Decide whether, when, or how the real object is reached.

---

# 9. Recognition question

Ask:

> Am I adding optional behavior, or controlling access to the original?

If:

```text
logging
compression
encryption
formatting
```

think:

```text
Decorator
```

If:

```text
permission
lazy initialization
remote representation
cache gate
rate limit
```

think:

```text
Proxy
```

Memory:

```text
Decorator = enhance
Proxy     = control
```

---

# 10. Ambiguous cases

Caching is interesting.

A caching wrapper may be:

```text
Proxy-like
```

if the key idea is:

> Decide whether to call the real service.

Logging may be:

```text
Decorator-like
```

if the purpose is:

> Add logging behavior.

Same structure.

Different intent.

That's why pattern identification is not purely mechanical.

---

# Part III — Adapter vs Facade

Both can sit between a client and another subsystem.

But they solve different problems.

---

# 11. Adapter asks: "This interface doesn't fit."

Suppose your application expects:

```java
interface PaymentGateway {

    void charge(
        Money amount
    );
}
```

Third-party library provides:

```java
class LegacyGateway {

    void makePayment(
        int cents
    );
}
```

Adapter:

```java
class LegacyGatewayAdapter
        implements PaymentGateway {

    private final LegacyGateway gateway;

    public void charge(
            Money amount) {

        gateway.makePayment(
            amount.toCents()
        );
    }
}
```

Adapter translates between incompatible interfaces.

---

# 12. Facade asks: "This subsystem is too complicated."

Suppose checkout requires:

```text
inventory
payment
shipping
invoice
email
```

A client shouldn't orchestrate all of it.

Facade:

```java
class CheckoutFacade {

    public void placeOrder(
            OrderRequest request) {

        inventory.reserve(...);
        payment.charge(...);
        shipping.schedule(...);
        invoice.generate(...);
        email.send(...);
    }
}
```

Facade provides a simpler entry point.

---

# 13. Recognition question

Ask:

> Is the problem incompatibility or complexity?

If:

```text
"The API shape doesn't match."
```

→ Adapter.

If:

```text
"The subsystem is too complicated to use directly."
```

→ Facade.

Memory:

```text
Adapter = make it fit
Facade  = make it easy
```

---

# Part IV — Factory Method vs Abstract Factory

These are related but operate at different scales.

---

# 14. Factory Method asks: "Which concrete product should I create?"

Suppose:

```java
interface Notification {
    void send();
}
```

Creator:

```java
abstract class NotificationService {

    protected abstract Notification
            createNotification();

    public void notifyUser() {

        Notification notification =
                createNotification();

        notification.send();
    }
}
```

Subclass decides:

```text
EmailNotification
SmsNotification
```

Factory Method typically focuses on:

> One product hierarchy.

---

# 15. Abstract Factory asks: "Which family of related products should I create?"

Suppose UI components vary by platform.

Products:

```text
Button
Checkbox
Menu
```

Families:

```text
Windows
Mac
```

Factory:

```java
interface UiFactory {

    Button createButton();

    Checkbox createCheckbox();

    Menu createMenu();
}
```

Windows factory creates:

```text
WindowsButton
WindowsCheckbox
WindowsMenu
```

Mac factory creates:

```text
MacButton
MacCheckbox
MacMenu
```

Abstract Factory focuses on compatibility across a family.

---

# 16. Recognition question

Ask:

> Do I need one varying product, or a whole compatible family?

One product:

```text
Factory Method
```

Family:

```text
Abstract Factory
```

Memory:

```text
Factory Method
= choose one product

Abstract Factory
= choose one product family
```

---

# 17. Useful matrix

Imagine:

| | Button | Checkbox | Menu |
|---|---|---|---|
| Windows | WinButton | WinCheckbox | WinMenu |
| Mac | MacButton | MacCheckbox | MacMenu |

Abstract Factory works across a row:

```text
Windows family
Mac family
```

Factory Method usually handles one column/type at a time.

---

# Part V — Builder vs Factory

Both create objects.

But they solve different creation problems.

---

# 18. Factory asks: "Which object should I create?"

Example:

```java
PaymentMethod method =
        paymentFactory.create(
            PaymentType.CARD
        );
```

You ask for a type.

Factory gives you a ready-to-use object.

---

# 19. Builder asks: "How should I configure and assemble this object?"

Example:

```java
HttpRequest request =
        HttpRequest.builder()
            .url(url)
            .method("POST")
            .header(...)
            .timeout(...)
            .body(...)
            .build();
```

The problem isn't choosing `HttpRequest` versus another product.

The problem is constructing one object with:

```text
many parameters
optional values
defaults
validation
steps
```

---

# 20. Recognition question

Ask:

> Is creation difficult because there are many configuration choices, or because I need to choose a concrete type?

Choose concrete type:

```text
Factory
```

Configure complex object:

```text
Builder
```

Memory:

```text
Factory = WHICH object?
Builder = HOW configured?
```

---

# 21. They can work together

A factory may return a builder:

```java
builderFactory
    .create(type)
    .option(...)
    .build();
```

or a Builder may use factories internally.

Patterns aren't mutually exclusive.

---

# Part VI — Bridge vs Strategy

This is another subtle pair because both use composition.

---

# 22. Strategy separates a context from an algorithm

Example:

```text
Navigation
→ FastestRouteStrategy
→ ScenicRouteStrategy
```

There's one primary context hierarchy.

The changing thing is:

```text
algorithm
```

---

# 23. Bridge separates two independent hierarchies

Example:

```text
Shapes:
Circle
Square
Triangle

Rendering:
Vector
Raster
3D
```

Without Bridge:

```text
VectorCircle
RasterCircle
ThreeDCircle
VectorSquare
RasterSquare
...
```

With Bridge:

```java
abstract class Shape {

    protected Renderer renderer;
}
```

Now both sides vary independently.

---

# 24. Recognition question

Ask:

> Do I have one context with interchangeable behavior, or two whole dimensions that grow independently?

One context + interchangeable algorithm:

```text
Strategy
```

Two independent dimensions:

```text
Bridge
```

Memory:

```text
Strategy = swap behavior
Bridge   = separate axes
```

---

# 25. Mathematical clue

If subclass count is approaching:

```text
m × n
```

because every `X` needs a version for every `Y`, think:

```text
Bridge
```

Strategy usually isn't about solving Cartesian-product inheritance.

---

# Part VII — Observer vs Mediator

Both involve object communication.

But their communication shape differs.

---

# 26. Observer is one-to-many notification

```text
Publisher
   |
   +--> Subscriber A
   +--> Subscriber B
   +--> Subscriber C
```

Publisher says:

> Something happened.

Subscribers react independently.

Examples:

```text
Stock price changed
Order placed
Button clicked
```

---

# 27. Mediator coordinates many peers

```text
Component A
    \
     Mediator
    /   \
Component B
Component C
```

Mediator contains interaction rules.

Example UI:

```text
Country dropdown changes
→ mediator updates state dropdown
→ recalculates tax
→ enables/disables submit
```

It's more than broadcasting an event.

It's coordinating relationships.

---

# 28. Recognition question

Ask:

> Do many listeners independently react to an event, or do many peer objects need centralized interaction logic?

Independent subscribers:

```text
Observer
```

Central coordination:

```text
Mediator
```

Memory:

```text
Observer = announce
Mediator = coordinate
```

---

# 29. Another clue

Observer tends to reduce coupling by:

```text
publisher knows observer abstraction
```

Mediator reduces coupling by:

```text
components stop knowing one another
```

That's a useful distinction.

---

# Part VIII — Observer vs Chain of Responsibility

They both may involve several recipients.

But the request flow is very different.

---

# 30. Observer fans out

```text
             Observer A
            /
Publisher -+-- Observer B
            \
             Observer C
```

All relevant observers may receive the event.

Example:

```text
OrderPlaced
→ email
→ analytics
→ loyalty
```

---

# 31. Chain flows through

```text
Request
  ↓
Handler A
  ↓
Handler B
  ↓
Handler C
```

Handlers process sequentially.

A handler may stop the chain.

Example:

```text
Authentication
→ Authorization
→ Validation
→ Controller
```

---

# 32. Recognition question

Ask:

> Is this broadcast or sequential processing?

Broadcast:

```text
Observer
```

Sequential pipeline/escalation:

```text
Chain
```

Memory:

```text
Observer = fan out
Chain    = flow through
```

---

# Part IX — Command vs Strategy

Both encapsulate behavior as objects.

But again, the question differs.

---

# 33. Command answers: "What action should happen?"

Examples:

```text
SaveDocumentCommand
DeleteFileCommand
TransferMoneyCommand
SendEmailCommand
```

Common API:

```java
command.execute();
```

Command can support:

```text
queueing
history
undo
scheduling
retry
logging
```

---

# 34. Strategy answers: "How should something be done?"

Examples:

```text
QuickSortStrategy
MergeSortStrategy

CardPaymentStrategy
PayPalPaymentStrategy
```

The Context chooses an algorithm.

---

# 35. Recognition question

Ask:

> Am I packaging a request, or selecting an algorithm?

Packaging request:

```text
Command
```

Selecting algorithm:

```text
Strategy
```

Memory:

```text
Command  = WHAT to do
Strategy = HOW to do it
```

---

# 36. Example

For navigation:

Strategy:

```text
FastestRouteStrategy
```

Command:

```text
StartNavigationCommand
CancelNavigationCommand
SaveRouteCommand
```

That contrast makes the difference very clear.

---

# Part X — Command vs Memento

Both are associated with Undo.

That's why they're often confused.

---

# 37. Command undo stores behavior

Example:

```java
class InsertTextCommand {

    void execute() {
        editor.insert(text);
    }

    void undo() {
        editor.deleteLast(
            text.length()
        );
    }
}
```

You reverse the action.

---

# 38. Memento undo stores state

Before editing:

```java
Snapshot previous =
        editor.save();
```

Undo:

```java
editor.restore(previous);
```

You restore a previous snapshot.

---

# 39. Recognition question

Ask:

> Is it easier to reverse the operation, or restore previous state?

Easy inverse operation:

```text
Command
```

Hard inverse, easy snapshot:

```text
Memento
```

Memory:

```text
Command = remember action
Memento = remember state
```

---

# 40. They often work together

A Command can store a Memento:

```java
class EditCommand {

    private Snapshot before;

    void execute() {

        before = editor.save();

        edit();
    }

    void undo() {

        editor.restore(before);
    }
}
```

This is a very natural combination.

---

# Part XI — Composite vs Visitor

These often appear together in tree structures.

But they solve different concerns.

---

# 41. Composite defines structure

Example:

```text
Folder
├── File
├── File
└── Folder
    ├── File
    └── File
```

Composite lets clients treat:

```text
File
Folder
```

through one common abstraction.

Question:

> How do I represent parts and groups uniformly?

---

# 42. Visitor defines operations across the structure

Suppose the same file tree needs:

```text
calculate total size
generate report
check permissions
find malware
export metadata
```

Visitor moves these operations outside the nodes.

Question:

> How do I add new operations across heterogeneous node types?

---

# 43. Recognition question

Ask:

> Am I solving the tree structure, or operations over that tree?

Tree structure:

```text
Composite
```

Operations across node types:

```text
Visitor
```

Memory:

```text
Composite = structure
Visitor   = operation
```

---

# 44. They commonly combine

```text
Composite
→ builds AST/tree

Visitor
→ performs operations over it
```

Examples:

```text
compiler AST
document tree
file system
UI tree
```

---

# Part XII — Iterator vs Visitor

Both can move through collections or trees.

But their responsibilities differ.

---

# 45. Iterator answers: "How do I reach the next element?"

Example:

```java
while (iterator.hasNext()) {
    Node node =
            iterator.next();
}
```

It controls traversal.

Examples:

```text
DFS
BFS
forward
reverse
lazy pagination
```

---

# 46. Visitor answers: "What do I do with each element type?"

Example:

```text
visitFile()
visitFolder()
```

Visitor may calculate:

```text
size
tax
report
code generation
```

---

# 47. Recognition question

Ask:

> Is the challenge traversing the structure, or performing type-specific operations?

Traversal:

```text
Iterator
```

Operation:

```text
Visitor
```

Memory:

```text
Iterator = how to walk
Visitor  = what to do
```

---

# 48. They can combine

```java
Iterator<Node> iterator =
        tree.iterator();

while (iterator.hasNext()) {

    iterator.next()
            .accept(visitor);
}
```

Iterator controls movement.

Visitor controls operation.

---

# Part XIII — Template Method vs Strategy

Both deal with changing algorithms.

The big distinction is:

```text
inheritance vs composition
```

but let's go deeper.

---

# 49. Template Method

Base class defines:

```java
public final void process() {

    read();

    validate();

    transform();

    save();
}
```

Subclasses customize:

```text
read()
transform()
```

The overall workflow is fixed.

Question:

> Several subclasses share the same sequence. How do I let them customize steps?

---

# 50. Strategy

Context delegates:

```java
strategy.execute();
```

The algorithm object is interchangeable.

Question:

> Which complete behavior should I use?

Strategy often supports runtime switching.

---

# 51. Recognition question

Ask:

> Is the algorithm skeleton fixed with a few variable steps, or should the whole behavior be interchangeable?

Fixed skeleton:

```text
Template Method
```

Whole behavior interchangeable:

```text
Strategy
```

Memory:

```text
Template Method = fixed skeleton
Strategy        = replace algorithm
```

---

# 52. Another distinction

Template Method:

```text
inheritance
compile-time subtype relationship
```

Strategy:

```text
composition
runtime configuration often possible
```

Because of composition, Strategy is generally more flexible.

Template Method is useful when inheritance accurately models the family.

---

# Part XIV — Flyweight vs Prototype

These almost point in opposite directions.

---

# 53. Prototype says: “Make another one.”

Prototype is used when you already have a configured object and want to create another object by copying it.

For example:

```java
GameCharacter warrior =
        new GameCharacter(
            "Warrior",
            100,
            50,
            heavyArmor
        );

GameCharacter anotherWarrior =
        warrior.copy();
```

The important idea is:

> Create a new independent object based on an existing object.

Conceptually:

```text
Existing Object
      |
      | clone / copy
      v
New Object
```

The copied object may initially have the same values, but it represents a separate instance.

---

# 54. Flyweight says: “Don’t make another one.”

Flyweight has almost the opposite instinct.

Suppose 100,000 game characters use the same:

```text
armor model
texture
animation data
weapon model
```

Instead of copying that data 100,000 times, we share it.

```java
class Character {

    private int x;
    private int y;

    private CharacterType type;
}
```

And:

```java
class CharacterType {

    private final Texture texture;
    private final Model model;
    private final Animation animation;
}
```

Many characters reference the same:

```java
CharacterType
```

Conceptually:

```text
Character A ─┐
Character B ─┼──> Shared CharacterType
Character C ─┘
```

Flyweight says:

> If identical heavy state can safely be shared, reuse it.

---

# 55. Prototype vs Flyweight

The easiest comparison is:

```text
Prototype
→ duplicate

Flyweight
→ share
```

Prototype:

```text
Object A
   |
   | copy
   v
Object B
```

Flyweight:

```text
Object A ─┐
Object B ─┼──> shared object
Object C ─┘
```

---

# 56. Recognition question

Ask:

> Do I need another independent object, or do I want many objects to reuse identical data?

If you need:

```text
a separate configurable copy
```

think:

**Prototype**

If you need:

```text
memory savings through shared immutable state
```

think:

**Flyweight**

Memory:

```text
Prototype = copy
Flyweight = share
```

---

# 57. Example: game trees

Suppose we have:

```java
Tree oak =
        new Tree(
            oakTexture,
            oakModel,
            10,
            20
        );
```

If we want another independent tree configuration based on `oak`:

```java
Tree another =
        oak.copy();
```

That's Prototype.

But if one million trees all use the same Oak texture/model:

```text
Tree 1 ─┐
Tree 2 ─┼──> OakTreeType
Tree 3 ─┘
```

that's Flyweight.

Same domain.

Very different intention.

---

# 58. The most important lesson of Lesson 30

Notice something across every comparison we've covered.

Very often, two patterns have similar code structures.

For example:

```java
class Something {

    private Interface dependency;
}
```

could potentially participate in:

```text
Strategy
State
Bridge
Decorator
Proxy
Mediator
```

You cannot reliably identify a pattern from:

```text
"this class contains an interface"
```

or:

```text
"this class wraps another class"
```

You identify a pattern from:

> **Why does this relationship exist?**

That is the key to pattern selection.

---

# 59. Intent beats structure

Consider:

```java
class Wrapper
        implements Service {

    private final Service service;
}
```

What pattern is this?

You cannot answer yet.

If the purpose is:

```text
add compression
```

→ Decorator.

If the purpose is:

```text
authorization
```

→ Proxy.

If the purpose is:

```text
pass the request to the next processor
```

→ possibly Chain of Responsibility.

The code shape alone isn't enough.

---

# 60. Ask “what is changing?”

This is one of the strongest LLD questions you can learn.

Suppose requirements say:

```text
"We currently support card payment,
but we'll add PayPal and bank transfer."
```

What is changing?

```text
payment algorithm
```

That suggests:

```text
Strategy
```

Suppose:

```text
"Order behavior is different when
Created, Paid, Shipped, or Delivered."
```

What is changing?

```text
lifecycle state
```

That suggests:

```text
State
```

Suppose:

```text
"We'll add Windows and Mac UI families."
```

What is changing?

```text
product family
```

That suggests:

```text
Abstract Factory
```

Pattern recognition begins with variation.

---

# 61. Ask “what is coupled?”

Another powerful question:

> Which classes know too much about one another?

Examples:

```text
Legacy API doesn't match our interface
→ Adapter
```

```text
UI components all reference each other
→ Mediator
```

```text
Client understands 7 subsystem classes
→ Facade
```

```text
Publisher knows every concrete listener
→ Observer
```

Patterns often exist to reduce a specific type of coupling.

---

# 62. Ask “what should the client NOT know?”

This question often reveals structural patterns.

Client should not know:

```text
third-party interface details
→ Adapter
```

```text
subsystem complexity
→ Facade
```

```text
whether object is remote/lazy/protected
→ Proxy
```

```text
how collection is stored
→ Iterator
```

```text
whether node is leaf or group
→ Composite
```

Good design is often about deciding which details should remain hidden.

---

# 63. Ask “what do I need to add frequently?”

This question is especially useful for OCP.

Suppose you frequently add:

```text
new algorithms
```

→ Strategy.

Frequently add:

```text
new operations across stable element types
```

→ Visitor.

Frequently add:

```text
new wrappers/features
```

→ Decorator.

Frequently add:

```text
new request-processing stages
```

→ Chain.

Frequently add:

```text
new listeners
```

→ Observer.

The expected direction of change strongly influences pattern choice.

---

# 64. Ask “does order matter?”

Order is a powerful clue.

If you have:

```text
authenticate
authorize
validate
rate limit
```

and the request flows through them:

```text
Chain of Responsibility
```

If you have:

```text
read
validate
transform
save
```

and this sequence must remain fixed while steps vary:

```text
Template Method
```

Those may look similar from far away, but the design pressure differs.

---

# 65. Chain vs Template Method — bonus distinction

This pair wasn't in our original comparison list, but it's worth knowing.

Template Method:

```java
process() {
    stepA();
    stepB();
    stepC();
}
```

Sequence lives inside the parent class.

Chain:

```text
Handler A
→ Handler B
→ Handler C
```

Sequence exists through object composition.

Template Method:

```text
fixed workflow
```

Chain:

```text
configurable pipeline
```

That's a useful distinction.

---

# 66. Ask “one or many?”

Several patterns become easy once you ask this.

One selected algorithm:

```text
Strategy
```

One current lifecycle mode:

```text
State
```

Many subscribers:

```text
Observer
```

Many sequential handlers:

```text
Chain
```

Many objects treated as one hierarchy:

```text
Composite
```

Many objects sharing one heavy value:

```text
Flyweight
```

Small wording differences matter.

---

# 67. Ask “creation or behavior?”

First determine the broad category.

If your problem is:

> How do I create this object?

Think **Creational**:

```text
Factory Method
Abstract Factory
Builder
Prototype
Singleton
```

If your problem is:

> How do I connect/organize these objects?

Think **Structural**:

```text
Adapter
Decorator
Facade
Composite
Proxy
Bridge
Flyweight
```

If your problem is:

> How do these objects behave/communicate?

Think **Behavioral**:

```text
Strategy
Observer
Command
State
Template Method
Chain
Iterator
Mediator
Memento
Visitor
Interpreter
```

This first classification narrows your search dramatically.

---

# 68. Creational decision map

Suppose the problem is object creation.

Ask:

```text
Do I need exactly one controlled instance?
        |
       yes
        v
    Singleton
```

Otherwise:

```text
Is construction complex with many
optional/configurable properties?
        |
       yes
        v
     Builder
```

Otherwise:

```text
Do I already have a configured object
that is expensive/difficult to recreate?
        |
       yes
        v
    Prototype
```

Otherwise:

```text
Do I need a family of related
compatible products?
        |
       yes
        v
 Abstract Factory
```

Otherwise:

```text
Do subclasses/configuration need to decide
which concrete product gets created?
        |
       yes
        v
 Factory Method
```

This isn't an absolute algorithm, but it's an excellent starting map.

---

# 69. Structural decision map

Ask:

```text
Does an existing interface not match
what the client expects?
        |
       yes
        v
     Adapter
```

```text
Is a subsystem too complicated
for callers?
        |
       yes
        v
      Facade
```

```text
Do I need to add optional behavior
around an object?
        |
       yes
        v
    Decorator
```

```text
Do I need controlled/lazy/remote access
to the real object?
        |
       yes
        v
      Proxy
```

```text
Do individual and grouped objects need
the same interface?
        |
       yes
        v
    Composite
```

```text
Are two dimensions creating a subclass
cross-product?
        |
       yes
        v
      Bridge
```

```text
Do huge numbers of objects duplicate
large identical state?
        |
       yes
        v
    Flyweight
```

---

# 70. Behavioral decision map

Ask:

```text
Several interchangeable algorithms?
→ Strategy
```

```text
Behavior changes with lifecycle?
→ State
```

```text
One event notifies many consumers?
→ Observer
```

```text
Need an action represented as an object?
→ Command
```

```text
Same algorithm skeleton,
some steps vary?
→ Template Method
```

```text
Request travels through handlers?
→ Chain of Responsibility
```

```text
Need traversal abstraction?
→ Iterator
```

```text
Many peer objects need coordination?
→ Mediator
```

```text
Need snapshot + restore?
→ Memento
```

```text
Stable type hierarchy,
many new operations?
→ Visitor
```

```text
Small grammar/DSL?
→ Interpreter
```

---

# 71. Pattern-selection example #1 — payment system

Requirement:

> Users can choose Card, PayPal, Apple Pay, or bank transfer.

Changing behavior:

```text
payment mechanism
```

Candidate:

```text
Strategy
```

Now suppose:

> Payment goes through Created → Authorized → Captured → Refunded.

That's another concern:

```text
State
```

Suppose:

> A payment request may be retried later from a job queue.

That's:

```text
Command-like
```

Suppose:

> Fraud, authorization, and validation must happen sequentially.

That's:

```text
Chain of Responsibility
```

One system can legitimately contain several patterns because they solve different problems.

---

# 72. This is extremely important

Never ask:

> What is the pattern for a payment system?

There is no single answer.

A payment system contains many design pressures:

```text
payment method variability
payment lifecycle
validation
provider adaptation
event notification
retry jobs
```

Each may justify a different design solution.

Patterns solve **local design problems**, not entire applications.

---

# 73. Pattern-selection example #2 — notification system

Requirement:

```text
Send Email, SMS, or Push.
```

Could be:

```text
Strategy
```

because delivery behavior varies.

Then:

```text
When an order is shipped,
notify several downstream systems.
```

Could be:

```text
Observer
```

Then:

```text
Existing Twilio SDK doesn't match
our SmsSender interface.
```

Could be:

```text
Adapter
```

Then:

```text
Retry failed notification jobs later.
```

Could involve:

```text
Command
```

Again, no single “Notification Pattern.”

---

# 74. Pattern-selection example #3 — parking lot

Suppose vehicle parking prices vary:

```text
Bike pricing
Car pricing
Truck pricing
```

Possibly:

```text
Strategy
```

Suppose parking spots are created according to type:

```text
CompactSpot
LargeSpot
ElectricSpot
```

Maybe a Factory is justified.

Suppose display boards should update when occupancy changes:

```text
Observer
```

Suppose a payment provider has an incompatible API:

```text
Adapter
```

But here's the important part:

> We shouldn't force any of these patterns unless the requirements justify them.

Maybe three simple classes are enough.

---

# 75. Don't pattern-match every noun

A dangerous beginner habit is:

```text
There is a "factory" building,
so use Factory Pattern.
```

Pattern names have nothing to do with domain vocabulary.

Similarly:

```text
There is an observer camera,
so use Observer.
```

No.

Design patterns refer to software relationships, not English nouns in the problem statement.

---

# 76. Don't pattern-match every verb either

Requirement says:

```text
"build a car"
```

That doesn't automatically mean Builder.

Requirement says:

```text
"observe a customer"
```

That doesn't automatically mean Observer.

Look at the actual software design pressure.

---

# 77. The “no pattern” option

This may be the most important pattern-selection answer:

> Sometimes you should use no design pattern.

Suppose:

```java
class TaxCalculator {

    double calculate(
            double amount) {

        return amount * 0.08;
    }
}
```

If tax calculation has one stable implementation, do not immediately create:

```text
TaxStrategy
TaxStrategyFactory
DefaultTaxStrategy
TaxContext
```

That's overengineering.

Simple code is often the best design.

---

# 78. Patterns have costs

Every abstraction adds something.

An interface adds:

```text
indirection
```

Factory adds:

```text
construction abstraction
```

Decorator adds:

```text
wrapping layers
```

Observer adds:

```text
hidden event flow
```

Mediator adds:

```text
central coordinator complexity
```

Visitor adds:

```text
double-dispatch boilerplate
```

Patterns are not free.

Use them when their benefit exceeds their complexity.

---

# 79. YAGNI matters

YAGNI:

> **You Aren't Gonna Need It.**

Don't design for imaginary requirements like:

```text
"Maybe someday there will be
47 payment methods."
```

if the product will clearly have one payment integration.

Design for realistic change.

Good extensibility is valuable.

Speculative architecture is not.

---

# 80. Avoid pattern stacking for its own sake

Bad thinking:

```text
Factory creates a Builder,
which builds a Strategy,
wrapped by Proxy,
wrapped by Decorator,
registered with Mediator,
published through Observer...
```

Could such a system exist?

Sure.

Should you build it because it sounds advanced?

Absolutely not.

Each abstraction should answer:

> What concrete problem does this solve?

If you can't answer that clearly, remove it.

---

# 81. A very good interview sentence

In an LLD interview, it's strong to say:

> “I wouldn't introduce a pattern yet. I'll first model the simplest design, and if this behavior needs to vary independently, we can extract it behind a Strategy.”

That demonstrates much more design maturity than immediately throwing patterns at the problem.

---

# 82. Start concrete, then abstract

A useful workflow is:

### Step 1

Build the simplest correct model.

For example:

```java
class CheckoutService {

    void payByCard(...) {
        ...
    }
}
```

### Step 2

Notice actual variation.

Requirement adds:

```text
PayPal
Bank transfer
```

### Step 3

Extract abstraction:

```java
PaymentStrategy
```

This is often better than starting with ten interfaces before understanding the domain.

---

# 83. Abstraction should follow a reason

Create an abstraction when you can say:

```text
This changes independently.

This has multiple implementations.

This hides an unstable dependency.

This prevents high-level code from knowing details.

This represents a real domain concept.
```

Don't create an abstraction because:

```text
"good code has interfaces."
```

That's not true.

Good code has useful abstractions.

---

# 84. Pattern selection using “axis of change”

Here's a powerful technique.

Write down the dimensions that may change.

Example:

```text
Notification type:
Alert
Reminder

Delivery:
Email
SMS
Push
```

If you create:

```text
EmailAlert
SmsAlert
PushAlert
EmailReminder
SmsReminder
PushReminder
```

you have:

```text
2 × 3
```

subclass combinations.

Two independent axes:

```text
Bridge
```

Now compare:

```text
PaymentService
```

where only:

```text
payment algorithm
```

changes.

One behavioral axis:

```text
Strategy
```

This way of thinking makes Bridge vs Strategy much easier.

---

# 85. Pattern selection using cardinality

Another trick:

Ask how many collaborators are involved.

```text
One selected implementation
→ Strategy / State
```

```text
One wrapped object
→ Decorator / Proxy
```

```text
Many child components
→ Composite
```

```text
Many listeners
→ Observer
```

```text
Many sequential handlers
→ Chain
```

```text
Many peer components through hub
→ Mediator
```

Cardinality doesn't determine the pattern by itself, but it helps.

---

# 86. Pattern selection using time

Ask:

> Is the behavior about now, later, or before?

Now:

```text
Strategy
→ use selected algorithm now
```

Lifecycle:

```text
State
→ behavior based on where we are now
```

Later:

```text
Command
→ action can be stored/executed later
```

Before:

```text
Memento
→ remember what state used to be
```

This can help distinguish behavioral patterns.

---

# 87. Pattern selection using direction of communication

Observer:

```text
one → many
```

Mediator:

```text
many ↔ center ↔ many
```

Chain:

```text
one → one → one → one
```

Command:

```text
invoker → command → receiver
```

Iterator:

```text
client ← next element ← collection
```

Thinking visually often makes the correct pattern obvious.

---

# 88. Pattern selection using ownership

Ask:

> Who should own the behavior?

If the behavior belongs to:

```text
selected algorithm object
→ Strategy
```

```text
current lifecycle object
→ State
```

```text
external operation over types
→ Visitor
```

```text
base workflow
→ Template Method
```

```text
request object
→ Command
```

This is an advanced but powerful design question.

---

# 89. A compact “symptom → pattern” cheat sheet

If you see:

```text
Huge switch based on algorithm type
→ Strategy
```

```text
Huge switch based on lifecycle state
→ State
```

```text
Constructors with 15 parameters
→ Builder
```

```text
Third-party API mismatch
→ Adapter
```

```text
Client calling 8 subsystem services
→ Facade
```

```text
Subclass explosion A×B
→ Bridge
```

```text
Same object repeatedly wrapped with features
→ Decorator
```

```text
Need lazy/security/remote wrapper
→ Proxy
```

```text
Tree of leaves + groups
→ Composite
```

```text
Millions of duplicate heavy values
→ Flyweight
```

```text
Many event listeners
→ Observer
```

```text
Request goes through filters
→ Chain
```

```text
Undo by snapshot
→ Memento
```

```text
Undo by reversing action
→ Command
```

```text
Stable type hierarchy + many operations
→ Visitor
```

```text
Small DSL / grammar
→ Interpreter
```

---

# 90. But beware of “code smells → automatic pattern”

A giant `switch` does not automatically mean Strategy.

For example:

```java
switch (dayOfWeek) {
    case MONDAY -> ...
    case TUESDAY -> ...
}
```

may be perfectly fine.

Ask:

```text
Will these branches grow?
Are they complex?
Do they need independent dependencies?
Do they change independently?
Do we need runtime substitution?
```

If not, keep the switch.

Patterns solve complexity.

They shouldn't create it.

---

# 91. Pattern combinations you should recognize

Some patterns naturally pair.

### Composite + Iterator

```text
Composite
→ builds tree

Iterator
→ traverses tree
```

### Composite + Visitor

```text
Composite
→ structure

Visitor
→ operations
```

### Command + Memento

```text
Command
→ action

Memento
→ saved state for undo
```

### Factory + Strategy

```text
Factory
→ selects/creates strategy

Strategy
→ executes behavior
```

### Observer + State

```text
State
→ object changes lifecycle

Observer
→ tells others that transition happened
```

---

# 92. More natural combinations

### Builder + Abstract Factory

Factory chooses the product family.

Builder constructs a complex object inside that family.

### Adapter + Facade

Adapters normalize third-party interfaces.

Facade gives the client one simple API over them.

### Chain + Command

Command packages request.

Chain validates/processes it.

### Bridge + Factory

Factory chooses implementation side.

Bridge connects implementation to abstraction.

Recognizing combinations is much more realistic than trying to force one pattern per system.

---

# 93. Patterns can evolve into one another

Suppose you begin with:

```java
if (paymentType == CARD) ...
```

Then requirements grow.

You extract:

```text
Strategy
```

Later strategy creation becomes complex.

Add:

```text
Factory
```

Later payment processing gains lifecycle states:

```text
State
```

Later notifications need subscribers:

```text
Observer
```

Good architecture evolves.

You do not need to predict everything at version 1.

---

# 94. Pattern selection during interviews

When given an LLD question, don't begin by saying:

> “I'm going to use Factory, Strategy, Observer and Singleton.”

Instead begin with:

```text
1. Clarify requirements.
2. Identify entities.
3. Identify responsibilities.
4. Identify changing behavior.
5. Model relationships.
6. Look for problematic coupling.
7. Introduce patterns only where they solve something.
```

This creates a much stronger design discussion.

---

# 95. Example interview thought process

Suppose interviewer says:

> Design a vending machine.

Don't immediately say:

```text
State Pattern!
```

Instead:

```text
Vending machine has:
inventory
selected product
inserted money
current operational state
```

Operations:

```text
insertMoney
selectProduct
dispense
refund
```

Then notice:

> These operations behave very differently depending on whether we're idle, have money, dispensing, or out of stock.

Now:

```text
State
```

emerges naturally.

That's the reasoning interviewers want.

---

# 96. Another interview thought process

> Design a notification service.

Identify:

```text
Notification
Recipient
Channel
Message
```

Then requirement:

```text
Email, SMS, and Push have
different sending behavior.
```

Possible:

```text
Strategy
```

Then requirement:

```text
Twilio SDK doesn't implement
our desired interface.
```

Possible:

```text
Adapter
```

Then requirement:

```text
New channels should be created
based on configuration.
```

Possible Factory.

Again, pattern choice follows requirements.

---

# 97. Pattern confidence levels

When selecting patterns, it's useful to think:

```text
Clear fit
Possible fit
Probably unnecessary
```

For example:

```text
Vending machine lifecycle
→ State is a clear fit.
```

```text
Creating parking spots
→ Factory might be useful,
  depending on construction complexity.
```

```text
Making ParkingLot Singleton
→ probably unnecessary unless
  requirements truly demand it.
```

You don't need to patternize everything.

---

# 98. The Singleton trap

A common LLD interview mistake is:

> “There should only be one parking lot manager, so Singleton.”

Not necessarily.

Business cardinality:

```text
one in our scenario
```

does not automatically imply:

```text
enforce one JVM instance globally
```

You may simply create one object in your composition root.

Use Singleton only when global controlled instance semantics are genuinely required.

---

# 99. The Factory trap

Another mistake:

> “We create objects, therefore Factory.”

Every Java program creates objects.

That alone doesn't justify Factory.

Use Factory when object creation itself has meaningful variation or complexity:

```text
choose subtype
hide construction details
centralize creation policy
```

Otherwise:

```java
new User(...)
```

is perfectly good.

---

# 100. The Strategy trap

Another common mistake:

```java
interface AdditionStrategy {
    int add(int a, int b);
}
```

when only one addition implementation exists.

Strategy is useful when algorithms are genuinely interchangeable.

Don't turn every method into an interface.

---

# 101. The Observer trap

Observer is attractive because it reduces direct coupling.

But it can create invisible execution paths.

You publish:

```java
eventPublisher.publish(
    new OrderPlaced(...)
);
```

and suddenly:

```text
seven handlers run somewhere else
```

Use Observer when independent reactions benefit from decoupling.

Don't use it when the workflow must remain explicit and ordered.

---

# 102. The Visitor trap

Visitor is sophisticated, but it isn't automatically good OO.

If element types change frequently, Visitor can be painful.

Always ask:

```text
What changes more often?

Operations?
or
Element types?
```

Operations:

```text
Visitor may help.
```

Element types:

```text
normal polymorphism may be better.
```

---

# 103. The inheritance trap

Patterns like:

```text
Template Method
Factory Method
```

use inheritance.

Don't automatically create deep inheritance trees.

Prefer shallow hierarchies.

If independent dimensions start multiplying, reconsider:

```text
composition
Strategy
Bridge
```

A design pattern should reduce complexity, not institutionalize it.

---

# 104. The “favor composition” rule

You've seen composition repeatedly:

```text
Strategy
Decorator
Proxy
Bridge
State
Mediator
```

Why is composition so powerful?

Because you can often change behavior by replacing objects:

```java
service.setStrategy(...);
```

rather than creating another inheritance branch.

But:

> Favor composition over inheritance does not mean inheritance is always wrong.

Template Method and true subtype relationships are still valid.

---

# 105. Pattern selection and SOLID

Patterns and SOLID should reinforce each other.

For example:

```text
Strategy
→ often supports OCP + DIP

Decorator
→ often supports OCP

Adapter
→ protects clients from external dependency changes

Observer
→ reduces concrete publisher-subscriber coupling

State
→ separates lifecycle-specific responsibilities
```

But you can also misuse a pattern and violate SOLID.

Patterns do not automatically make code good.

---

# 106. Pattern selection and SRP

Ask:

> Why does this class change?

Suppose:

```java
OrderService
```

changes whenever:

```text
payment provider changes
email behavior changes
shipping changes
discount changes
```

Too many reasons.

Patterns may help extract:

```text
PaymentStrategy
NotificationService
ShippingStrategy
```

But the goal is SRP.

The pattern is just a tool.

---

# 107. Pattern selection and OCP

Ask:

> What future addition currently forces me to edit stable code?

Example:

```java
if (paymentType == CARD) ...
else if (paymentType == PAYPAL) ...
```

Every new payment method modifies the same method.

Strategy may create an extension point.

But again:

```text
if there are only two stable branches,
the simpler conditional may still be fine.
```

OCP should be applied where change is realistic.

---

# 108. Pattern selection and DIP

Ask:

> Is high-level policy depending directly on unstable implementation details?

Example:

```java
class CheckoutService {

    StripeSdk stripeSdk;
}
```

Maybe better:

```java
PaymentGateway gateway;
```

and Stripe is adapted behind it.

That could involve:

```text
DIP + Adapter
```

Patterns often emerge naturally from SOLID reasoning.

---

# 109. Your 14 comparison shortcuts

Let's compress the entire lesson you requested:

```text
Strategy vs State
Algorithm vs Lifecycle
```

```text
Decorator vs Proxy
Enhance vs Control
```

```text
Adapter vs Facade
Make compatible vs Make simple
```

```text
Factory Method vs Abstract Factory
One product vs Product family
```

```text
Builder vs Factory
Configure object vs Choose object
```

```text
Bridge vs Strategy
Two dimensions vs One algorithm dimension
```

```text
Observer vs Mediator
Broadcast vs Coordinate
```

```text
Observer vs Chain
Fan out vs Flow through
```

```text
Command vs Strategy
WHAT vs HOW
```

```text
Command vs Memento
Action history vs State history
```

```text
Composite vs Visitor
Structure vs Operation
```

```text
Iterator vs Visitor
Traversal vs Operation
```

```text
Template Method vs Strategy
Fixed skeleton vs Replaceable algorithm
```

```text
Flyweight vs Prototype
Share vs Copy
```

---

# 110. The ultimate 23-pattern cheat sheet

## Creational

```text
Factory Method
→ let creation vary
```

```text
Abstract Factory
→ create related families
```

```text
Builder
→ construct step by step
```

```text
Prototype
→ copy an existing object
```

```text
Singleton
→ control a single instance
```

## Structural

```text
Adapter
→ translate interfaces
```

```text
Decorator
→ add behavior
```

```text
Facade
→ simplify subsystem
```

```text
Composite
→ tree / part-whole
```

```text
Proxy
→ control access
```

```text
Bridge
→ separate variation dimensions
```

```text
Flyweight
→ share repeated state
```

## Behavioral

```text
Strategy
→ interchangeable algorithm
```

```text
Observer
→ notify subscribers
```

```text
Command
→ action as object
```

```text
State
→ lifecycle-based behavior
```

```text
Template Method
→ fixed workflow
```

```text
Chain
→ handler pipeline
```

```text
Iterator
→ traversal
```

```text
Mediator
→ coordination
```

```text
Memento
→ snapshot
```

```text
Visitor
→ external operations across types
```

```text
Interpreter
→ grammar as objects
```

---

# 111. A decision framework you can actually use

When facing a problem, walk through this:

```text
1. What are the requirements?
        ↓
2. What are the main domain entities?
        ↓
3. What responsibilities belong to each?
        ↓
4. What behavior varies?
        ↓
5. What dependencies are unstable?
        ↓
6. What relationships are becoming complex?
        ↓
7. What future change do we realistically expect?
        ↓
8. Can simple classes solve it?
        ↓
9. If not, which known design pressure
   matches a pattern?
        ↓
10. Apply the smallest useful pattern.
```

That process matters far more than memorizing diagrams.

---

# 112. The “three questions” shortcut

If you're stuck, ask these three questions:

### What changes?

This often reveals:

```text
Strategy
State
Bridge
Factory
```

### What is coupled?

This often reveals:

```text
Adapter
Facade
Mediator
Observer
```

### What capability do I need?

For example:

```text
undo
→ Command / Memento

tree
→ Composite

traversal
→ Iterator

pipeline
→ Chain

snapshot
→ Memento
```

Those three questions get you surprisingly far.

---

# 113. Pattern selection example from scratch

Requirement:

> Design a file explorer.

First:

```text
Files and folders form a hierarchy.
```

That suggests:

```text
Composite
```

Next:

> Need DFS and BFS traversal.

Possible:

```text
Iterator
```

Next:

> Need operations like calculate size, virus scan, export metadata.

If operations become numerous and node types are stable:

```text
Visitor
```

Next:

> Need lazy loading for remote files.

Potential:

```text
Proxy
```

Notice the reasoning:

```text
requirement
→ design pressure
→ possible pattern
```

not:

```text
pattern
→ search for somewhere to use it
```

---

# 114. Another example — online editor

Requirement:

> User can undo changes.

Question:

```text
Can edits easily reverse themselves?
```

If yes:

```text
Command
```

If restoring snapshots is simpler:

```text
Memento
```

Could combine both.

Requirement:

> Different file exporters: PDF, HTML, Markdown.

If it's a stable document tree with many exporting/analysis operations:

```text
Visitor
```

Requirement:

> UI components all interact heavily.

Possibly:

```text
Mediator
```

Again, one application may naturally use several patterns.

---

# 115. Another example — API request processing

Requirement:

```text
logging
authentication
authorization
rate limiting
validation
controller
```

Request flows sequentially:

```text
Chain of Responsibility
```

Requirement:

> Authentication can use JWT, API key, or OAuth.

Within the authentication stage:

```text
Strategy
```

Requirement:

> OAuth library has incompatible interface.

Inside that strategy:

```text
Adapter
```

Pattern composition follows architecture layers naturally.

---

# 116. Don't say “this system uses X pattern”

Prefer saying:

> “For the pricing variation, I would consider Strategy.”

or:

> “For order lifecycle behavior, State would fit.”

That's more precise than:

> “Parking lot uses Strategy Pattern.”

Systems don't usually map one-to-one with patterns.

Specific relationships do.

---

# 117. How to explain your choice in interviews

A strong explanation has four parts.

For example, Strategy:

> “Pricing rules vary independently and we expect new pricing schemes. Keeping them in one `switch` would require modifying the calculator repeatedly. I'll extract a `PricingStrategy` interface so the parking workflow depends on the abstraction, and new pricing rules can be added independently.”

Notice you explained:

```text
problem
expected change
pattern
benefit
```

Much stronger than:

> “I'll use Strategy because this looks like Strategy.”

---

# 118. How to reject a pattern in interviews

Also valuable:

> “Builder isn't necessary here because the object has only three required constructor arguments and no complicated optional configuration.”

or:

> “I wouldn't introduce Observer yet because there is only one explicit downstream action and making it event-driven would obscure the workflow.”

Knowing when **not** to use patterns demonstrates strong design judgment.

---

# 119. When two patterns both seem valid

Sometimes they genuinely are.

For example:

```text
Logging wrapper
```

could be discussed as Decorator.

A framework-generated interception layer may feel Proxy-like.

Don't panic about pattern labels.

Ask:

> Which intent is more useful for explaining this design?

Patterns are vocabulary.

They're not laws of physics.

---

# 120. Final lesson principle

The single most important sentence from Lesson 30 is:

> **Design patterns are names for recurring solutions—not goals for your code.**

Your goal is:

```text
correct
clear
maintainable
testable
extensible where needed
simple enough to understand
```

If a pattern helps achieve that:

```text
use it
```

If it doesn't:

```text
don't
```

---

# Lesson 30 complete ✅

You have now completed:

```text
OOP / design foundations     ✅

SOLID                        ✅

5 Creational Patterns        ✅

7 Structural Patterns        ✅

11 Behavioral Patterns       ✅

23 / 23 GoF Patterns         ✅

Pattern Selection            ✅
```

So the **“learn the design-pattern toolbox”** portion is now complete.

The next phase is where we stop studying one pattern at a time and start learning how to design systems from a blank page:

# Lesson 31 — How to Approach Any LLD Problem

The core framework will be:

```text
Requirements
     ↓
Use cases
     ↓
Entities
     ↓
Responsibilities
     ↓
Relationships
     ↓
Interfaces
     ↓
Changing behavior
     ↓
Lifecycle / state
     ↓
Class design
     ↓
Apply SOLID
     ↓
Patterns only if useful
     ↓
Edge cases
     ↓
Concurrency
     ↓
Extensibility
     ↓
UML / code
```

That is the point where your **23 individual patterns start turning into actual Low-Level Design skill**.
