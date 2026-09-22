# Lesson 23 — Template Method Pattern

The **Template Method Pattern** is used when several classes follow the **same overall algorithm**, but some individual steps differ.

The core idea is:

> Define the algorithm skeleton in a base class, and let subclasses customize specific steps.

Unlike Strategy, which uses composition, Template Method usually relies on **inheritance**.

---

# 1. Start with the problem

Suppose we process different file formats:

```text
CSV
JSON
XML
```

Each processor follows the same workflow:

```text
1. Read data
2. Validate
3. Transform
4. Save
```

A naive implementation might look like:

```java
class CsvProcessor {

    public void process() {
        readCsv();
        validateCsv();
        transformCsv();
        save();
    }
}
```

```java
class JsonProcessor {

    public void process() {
        readJson();
        validateJson();
        transformJson();
        save();
    }
}
```

```java
class XmlProcessor {

    public void process() {
        readXml();
        validateXml();
        transformXml();
        save();
    }
}
```

Notice the duplication.

The structure of the algorithm is identical.

Only some steps differ.

---

# 2. The real question

Ask:

> What is stable, and what varies?

Stable:

```text
read
validate
transform
save
```

The **order** is stable.

What varies:

```text
how CSV is read
how JSON is read
how XML is read
how each format is transformed
```

Template Method says:

> Put the stable workflow in the parent class. Let subclasses implement the variable steps.

---

# 3. Base class

```java
abstract class DataProcessor {

    public final void process() {

        read();

        validate();

        transform();

        save();
    }

    protected abstract void read();

    protected abstract void transform();

    protected void validate() {
        System.out.println(
            "Default validation"
        );
    }

    protected void save() {
        System.out.println(
            "Saving data"
        );
    }
}
```

The important method is:

```java
public final void process()
```

That is the **Template Method**.

It defines the algorithm skeleton.

---

# 4. CSV implementation

```java
class CsvProcessor
        extends DataProcessor {

    @Override
    protected void read() {

        System.out.println(
            "Reading CSV"
        );
    }

    @Override
    protected void transform() {

        System.out.println(
            "Transforming CSV"
        );
    }
}
```

Usage:

```java
DataProcessor processor =
        new CsvProcessor();

processor.process();
```

Output:

```text
Reading CSV
Default validation
Transforming CSV
Saving data
```

---

# 5. JSON implementation

```java
class JsonProcessor
        extends DataProcessor {

    @Override
    protected void read() {

        System.out.println(
            "Reading JSON"
        );
    }

    @Override
    protected void transform() {

        System.out.println(
            "Transforming JSON"
        );
    }
}
```

The algorithm itself remains:

```text
read
validate
transform
save
```

The subclass only customizes selected steps.

---

# 6. Why make `process()` final?

Suppose subclasses could override:

```java
process()
```

A subclass might accidentally do:

```java
@Override
public void process() {

    transform();
    save();
}
```

and skip validation.

If the workflow order is an invariant, we want to protect it.

So:

```java
public final void process()
```

means:

> Subclasses may customize steps, but not the overall algorithm.

That's a very important Template Method idea.

---

# 7. Structure

Conceptually:

```text
        AbstractClass
        DataProcessor
              |
        process()
        /  |   |  \
     read validate transform save
      ^              ^
      |              |
 -------------------------
 |           |           |
CSV         JSON         XML
```

The parent controls the workflow.

Subclasses fill in selected pieces.

---

# 8. Template Method roles

There are usually two main roles.

### Abstract class

Defines:

```text
algorithm skeleton
common steps
extension points
```

Example:

```java
DataProcessor
```

### Concrete subclasses

Implement or customize:

```text
variable steps
```

Examples:

```text
CsvProcessor
JsonProcessor
XmlProcessor
```

Simple pattern, but very useful.

---

# 9. Abstract steps

An abstract step forces subclasses to implement it.

Example:

```java
protected abstract void read();
```

Every processor must define:

```text
how data is read
```

That's appropriate when the parent cannot provide a meaningful default.

---

# 10. Concrete steps

Some steps may be identical for all subclasses.

Example:

```java
protected void save() {

    System.out.println(
        "Saving data"
    );
}
```

No subclass needs to change it unless you intentionally allow overriding.

This removes duplicated code.

---

# 11. Hook methods

A **hook** is an optional method with a default implementation.

For example:

```java
protected boolean shouldValidate() {
    return true;
}
```

Template method:

```java
public final void process() {

    read();

    if (shouldValidate()) {
        validate();
    }

    transform();

    save();
}
```

Most subclasses do nothing.

One subclass could override:

```java
@Override
protected boolean shouldValidate() {
    return false;
}
```

Hooks allow controlled customization.

---

# 12. Hook vs abstract method

Abstract method:

```java
protected abstract void transform();
```

means:

> You must provide this step.

Hook:

```java
protected void beforeSave() {
}
```

means:

> Override this only if you need to.

That's the distinction.

---

# 13. Example with hooks

```java
abstract class ReportGenerator {

    public final void generate() {

        loadData();

        prepare();

        if (includeHeader()) {
            addHeader();
        }

        render();

        save();
    }

    protected abstract void loadData();

    protected abstract void render();

    protected void prepare() {
        System.out.println(
            "Preparing data"
        );
    }

    protected boolean includeHeader() {
        return true;
    }

    protected void addHeader() {
        System.out.println(
            "Adding header"
        );
    }

    protected void save() {
        System.out.println(
            "Saving report"
        );
    }
}
```

A special report can customize:

```java
@Override
protected boolean includeHeader() {
    return false;
}
```

without rewriting the whole algorithm.

---

# 14. Real-world example — beverage preparation

Classic example:

```text
Tea
Coffee
```

Both follow:

```text
boil water
brew
pour into cup
add condiments
```

The overall algorithm is stable.

Only brewing and condiments differ.

---

# 15. Base beverage class

```java
abstract class Beverage {

    public final void prepare() {

        boilWater();

        brew();

        pourIntoCup();

        addCondiments();
    }

    private void boilWater() {

        System.out.println(
            "Boiling water"
        );
    }

    protected abstract void brew();

    private void pourIntoCup() {

        System.out.println(
            "Pouring into cup"
        );
    }

    protected abstract void addCondiments();
}
```

Coffee:

```java
class Coffee extends Beverage {

    @Override
    protected void brew() {

        System.out.println(
            "Brewing coffee"
        );
    }

    @Override
    protected void addCondiments() {

        System.out.println(
            "Adding milk and sugar"
        );
    }
}
```

Tea:

```java
class Tea extends Beverage {

    @Override
    protected void brew() {

        System.out.println(
            "Steeping tea"
        );
    }

    @Override
    protected void addCondiments() {

        System.out.println(
            "Adding lemon"
        );
    }
}
```

Same algorithm.

Different steps.

---

# 16. Template Method reduces workflow duplication

Without it:

```text
Coffee.prepare()
Tea.prepare()
HotChocolate.prepare()
GreenTea.prepare()
```

may all duplicate:

```text
boil
pour
serve
```

With Template Method:

```text
Base class
→ owns common sequence

Subclass
→ owns varying steps
```

That's the main benefit.

---

# 17. Real-world example — authentication workflow

Suppose multiple login mechanisms follow:

```text
1. Read credentials
2. Validate format
3. Authenticate
4. Create session
5. Audit login
```

But authentication differs:

```text
password
OAuth
API key
certificate
```

You might write:

```java
abstract class AuthenticationFlow {

    public final Session login(
            Request request) {

        Credentials credentials =
                readCredentials(request);

        validate(credentials);

        User user =
                authenticate(credentials);

        Session session =
                createSession(user);

        audit(user);

        return session;
    }

    protected abstract Credentials
        readCredentials(
            Request request
        );

    protected abstract User
        authenticate(
            Credentials credentials
        );

    protected void validate(
            Credentials credentials) {
        ...
    }

    protected Session createSession(
            User user) {
        ...
    }

    protected void audit(
            User user) {
        ...
    }
}
```

Then subclasses customize only the necessary parts.

---

# 18. Real-world example — payment processing

Suppose every payment flow follows:

```text
validate request
calculate fee
authorize
capture
record transaction
notify
```

But authorization and capture differ by provider.

A Template Method might look like:

```java
abstract class PaymentProcessor {

    public final PaymentResult process(
            PaymentRequest request) {

        validate(request);

        Money fee =
                calculateFee(request);

        Authorization auth =
                authorize(
                    request,
                    fee
                );

        PaymentResult result =
                capture(auth);

        record(result);

        notifyCustomer(result);

        return result;
    }

    protected abstract Authorization
        authorize(
            PaymentRequest request,
            Money fee
        );

    protected abstract PaymentResult
        capture(
            Authorization auth
        );

    protected void validate(
            PaymentRequest request) {
        ...
    }

    protected Money calculateFee(
            PaymentRequest request) {
        ...
    }

    protected void record(
            PaymentResult result) {
        ...
    }

    protected void notifyCustomer(
            PaymentResult result) {
        ...
    }
}
```

The workflow remains controlled by the parent.

---

# 19. Hollywood Principle

Template Method is often associated with the:

> **Hollywood Principle**

Meaning:

> Don't call us; we'll call you.

Normally, client code calls methods on an object.

With Template Method, the base class calls subclass extension methods.

For example:

```java
process()
```

inside the parent calls:

```java
read();
transform();
```

Those methods are implemented by the subclass.

The parent controls execution.

The subclass plugs behavior into that flow.

---

# 20. Inversion of control

This is a form of **Inversion of Control**.

Instead of:

```text
Subclass controls workflow
```

we have:

```text
Parent framework controls workflow
Subclass provides customizable pieces
```

This is conceptually similar to frameworks.

A framework often says:

```text
"I'll control when things happen.
You provide callbacks/hooks."
```

Template Method embodies that idea.

---

# 21. Template Method vs Strategy

This is the biggest comparison.

Both solve algorithm variation.

But:

```text
Template Method
→ inheritance
```

while:

```text
Strategy
→ composition
```

Template Method:

```java
class CsvProcessor
        extends DataProcessor
```

Strategy:

```java
class DataProcessor {

    private TransformStrategy strategy;
}
```

---

# 22. Template Method locks the workflow

Suppose:

```java
process() {
    read();
    validate();
    transform();
    save();
}
```

The sequence is fixed.

Subclasses customize steps.

Strategy is more flexible:

```java
processor.setStrategy(
    new SomeStrategy()
);
```

Behavior can often be swapped at runtime.

So:

```text
Template Method
→ fixed skeleton, customizable steps

Strategy
→ interchangeable complete behavior
```

---

# 23. Template Method vs Strategy example

Imagine sorting a file.

Template Method:

```text
read
parse
sort
save
```

where only:

```text
parse
sort
```

may vary.

Strategy:

```text
QuickSort
MergeSort
HeapSort
```

where the sorting algorithm itself is interchangeable.

They can even be used together.

---

# 24. Combining Template Method + Strategy

Example:

```java
abstract class ImportJob {

    private final ValidationStrategy
            validation;

    protected ImportJob(
            ValidationStrategy validation) {

        this.validation = validation;
    }

    public final void run() {

        Data data = read();

        validation.validate(data);

        transform(data);

        save(data);
    }

    protected abstract Data read();

    protected abstract void transform(
        Data data
    );

    protected abstract void save(
        Data data
    );
}
```

Template Method controls:

```text
workflow
```

Strategy controls:

```text
validation algorithm
```

Patterns can cooperate.

---

# 25. Template Method vs State

State:

> Behavior changes because lifecycle state changes.

Template Method:

> Algorithm skeleton stays fixed while subclasses customize steps.

State:

```text
Created
Paid
Shipped
```

Template Method:

```text
read
validate
transform
save
```

Different problems.

---

# 26. Template Method vs Command

Command:

> Package an action as an object.

Template Method:

> Define reusable algorithm sequence through inheritance.

Command might represent:

```text
GenerateReportCommand
```

That command could internally call:

```java
reportGenerator.generate();
```

where `generate()` is a Template Method.

Again, patterns compose.

---

# 27. Template Method vs Factory Method

This comparison is interesting because they often work together.

Template Method defines:

```java
public final void run() {

    Product product =
            createProduct();

    configure(product);

    execute(product);
}
```

and:

```java
protected abstract Product
        createProduct();
```

is a Factory Method.

So:

```text
Template Method
→ controls algorithm

Factory Method
→ customizes object creation step
```

This is a classic combination.

---

# 28. Example combining both

```java
abstract class DocumentWorkflow {

    public final void process() {

        Document document =
                createDocument();

        document.load();

        validate(document);

        document.save();
    }

    protected abstract Document
        createDocument();

    protected void validate(
            Document document) {
        ...
    }
}
```

`createDocument()` is Factory Method.

`process()` is Template Method.

Very common pattern combination.

---

# 29. Template Method and OCP

Suppose we have:

```text
CsvProcessor
JsonProcessor
XmlProcessor
```

Then add:

```java
class YamlProcessor
        extends DataProcessor {
    ...
}
```

The common workflow stays unchanged.

The system extends through subclassing.

That's OCP.

---

# 30. Template Method and SRP

Base class:

```text
owns workflow structure
```

Subclass:

```text
owns specialized steps
```

This can keep responsibilities clean.

But there is a danger.

If the base class becomes huge and contains dozens of unrelated hooks, SRP suffers.

---

# 31. Template Method and LSP

Subclass implementations must honor expectations of the base algorithm.

Suppose:

```java
protected abstract void save();
```

One subclass implements:

```java
protected void save() {
    throw new UnsupportedOperationException();
}
```

even though the algorithm requires saving.

That's suspicious.

Template Method depends on subclasses respecting the base-class contract.

---

# 32. Template Method and inheritance coupling

Because this pattern uses inheritance, subclasses are coupled to the parent.

They need to understand:

```text
which methods are called
in what order
which methods may be overridden
which invariants must be preserved
```

This is sometimes called the:

> Fragile base class problem.

Changes to the parent can affect many subclasses.

That's the biggest tradeoff compared with Strategy.

---

# 33. Protected methods are part of a subclass API

Suppose the parent exposes:

```java
protected void stepA();
protected void stepB();
protected void stepC();
```

These aren't public to normal callers, but they form an API for subclasses.

Changing them can break subclasses.

So design template extension points carefully.

---

# 34. Avoid calling overridable methods from constructors

This is a Java-specific caution.

Bad:

```java
abstract class Base {

    Base() {
        initialize();
    }

    protected abstract void initialize();
}
```

When the base constructor runs, subclass fields may not yet be initialized.

That can produce surprising bugs.

Template Method should usually run after construction, not from the superclass constructor.

---

# 35. Too many hooks is a smell

Suppose:

```java
process() {
    beforeRead();
    read();
    afterRead();
    beforeValidate();
    validate();
    afterValidate();
    beforeTransform();
    transform();
    afterTransform();
    beforeSave();
    save();
    afterSave();
}
```

Technically flexible.

But now subclass behavior becomes hard to understand.

Too many hooks can indicate:

```text
inheritance is becoming too complex
```

At that point, composition or events may be cleaner.

---

# 36. The "hook hell" problem

If subclasses must know:

```text
override hook A only if B is false
unless C was overridden
and D runs before E
```

the design is too fragile.

A good Template Method should have:

```text
clear workflow
small number of extension points
obvious contracts
```

---

# 37. When inheritance is actually appropriate

We've repeatedly said:

> Favor composition over inheritance.

That does **not** mean:

> Never use inheritance.

Template Method is a case where inheritance makes sense when:

```text
there is a genuine common workflow
subclasses share strong conceptual relationship
the algorithm structure is stable
only selected steps differ
```

For example:

```text
CsvImporter
JsonImporter
XmlImporter
```

may genuinely belong to the same processing family.

---

# 38. When Strategy is better

Suppose you need:

```text
runtime swapping
multiple independent behavior dimensions
easy composition
reduced inheritance coupling
```

Strategy is probably better.

For example:

```java
processor.setCompressionStrategy(
    new GzipCompression()
);
```

is easier than creating:

```text
GzipCsvProcessor
GzipJsonProcessor
ZipCsvProcessor
ZipJsonProcessor
```

That's exactly where inheritance starts multiplying combinations.

---

# 39. Real-world example — build pipeline

Suppose every build process follows:

```text
download dependencies
compile
test
package
deploy
```

but language-specific steps differ.

```java
abstract class BuildPipeline {

    public final void run() {

        downloadDependencies();

        compile();

        runTests();

        packageArtifact();

        deploy();
    }

    protected abstract void
        downloadDependencies();

    protected abstract void compile();

    protected abstract void runTests();

    protected abstract void
        packageArtifact();

    protected void deploy() {

        System.out.println(
            "Default deployment"
        );
    }
}
```

Then:

```text
JavaBuildPipeline
NodeBuildPipeline
GoBuildPipeline
```

can specialize the steps.

---

# 40. Real-world example — game AI turn

Suppose different enemies follow:

```text
observe world
choose target
move
attack
end turn
```

Base class:

```java
abstract class EnemyAI {

    public final void takeTurn() {

        observe();

        Target target =
                chooseTarget();

        moveToward(target);

        attack(target);

        endTurn();
    }

    protected void observe() {
        ...
    }

    protected abstract Target
        chooseTarget();

    protected abstract void
        moveToward(
            Target target
        );

    protected abstract void
        attack(
            Target target
        );

    protected void endTurn() {
        ...
    }
}
```

Different AI types customize decisions without rewriting the turn structure.

---

# 41. Real-world example — test setup

Testing frameworks often have Template-Method-like lifecycles:

```text
setup
run test
teardown
```

Conceptually:

```java
run() {

    setUp();

    executeTest();

    tearDown();
}
```

The framework controls the sequence.

Your code provides pieces.

Again:

> Don't call us; we'll call you.

---

# 42. Hooks for optional behavior

Suppose backup is optional:

```java
protected boolean shouldBackup() {
    return false;
}
```

Template:

```java
public final void process() {

    read();

    transform();

    if (shouldBackup()) {
        backup();
    }

    save();
}
```

Subclass:

```java
@Override
protected boolean shouldBackup() {
    return true;
}
```

This can be elegant when used sparingly.

---

# 43. Template Method with validation

Suppose some invariants should never be bypassed.

```java
public final void execute(
        Request request) {

    Objects.requireNonNull(request);

    validateCommonRules(request);

    executeSpecificLogic(request);

    audit(request);
}
```

Only:

```java
executeSpecificLogic(...)
```

is customizable.

This is a powerful way to enforce framework-level invariants.

---

# 44. Template Method in frameworks

Many frameworks use Template Method-style design internally.

A framework may provide:

```text
lifecycle
transaction boundary
error handling
resource cleanup
```

and ask you to override or supply:

```text
business-specific operation
```

This is one reason the pattern matters beyond interviews.

It explains how frameworks retain control while still being extensible.

---

# 45. Common mistake: subclassing only for code reuse

Bad reason:

> These two classes share 15 lines, so I'll create a parent.

Inheritance should reflect a meaningful abstraction relationship, not merely eliminate duplication.

Ask:

> Is the subclass genuinely a specialized version of the base abstraction?

If not, composition or helper methods may be better.

---

# 46. Common mistake: base class knows concrete subclasses

Bad:

```java
if (this instanceof CsvProcessor) {
    ...
}
```

inside the Template Method.

That defeats polymorphism.

The base should call extension methods:

```java
read();
transform();
```

without knowing concrete subclass types.

---

# 47. Common mistake: subclasses override too much

If every subclass overrides:

```text
read
validate
transform
save
process
```

then the Template Method isn't providing much value.

The pattern works best when:

```text
algorithm structure is genuinely shared
```

and only selected steps vary.

---

# 48. Common mistake: template method isn't protected from override

If preserving workflow is important, prefer:

```java
public final void process()
```

Otherwise, subclasses can bypass the algorithm invariants.

Not every Template Method absolutely must be `final`, but in Java it often clearly communicates intent.

---

# 49. Common mistake: deep inheritance chains

Avoid:

```text
BaseProcessor
    ↑
ValidatedProcessor
    ↑
CachedValidatedProcessor
    ↑
CsvCachedValidatedProcessor
```

This becomes hard to reason about.

Template Method works best with relatively shallow inheritance.

If variation dimensions multiply, composition is probably better.

---

# 50. Recognition clues

Think Template Method when requirements say:

```text
"Several classes perform almost
the same workflow."

"The sequence of operations must remain fixed."

"Some steps differ by subtype."

"Common workflow code is duplicated."

"We want subclasses to customize
specific steps but not the whole algorithm."
```

The strongest recognition question is:

> **Is the overall algorithm stable while only some of its steps vary?**

If yes, Template Method is a strong candidate.

---

# 51. Interview answer

If asked:

> What is the Template Method Pattern?

A strong answer is:

> Template Method is a behavioral design pattern that defines the skeleton of an algorithm in a base class while allowing subclasses to override selected steps without changing the overall sequence of the algorithm. It uses inheritance and is useful when multiple implementations share the same workflow but differ in specific steps.

Then give the example:

> A `DataProcessor.process()` method can define `read → validate → transform → save`, while `CsvProcessor` and `JsonProcessor` override `read()` and `transform()`.

---

# 52. Interview comparison: Template Method vs Strategy

A strong answer is:

> Both allow behavior variation, but Template Method uses inheritance and keeps the algorithm skeleton in a base class, while Strategy uses composition and delegates behavior to interchangeable objects. Strategy is generally more flexible at runtime, while Template Method is useful when the workflow itself is stable and subclasses customize only selected steps.

---

# 53. Mental model

Remember:

```text
Base Class
   |
   | owns algorithm
   v

step 1
step 2
step 3
step 4

   ^
   |
subclasses customize
selected steps
```

Or even simpler:

```text
Template Method
=
fixed skeleton
+
variable steps
```

---

# Behavioral patterns so far

We've now covered:

```text
Strategy
→ interchangeable algorithms

Observer
→ notify listeners

Command
→ package actions

State
→ lifecycle-dependent behavior

Template Method
→ fixed algorithm skeleton
  with customizable steps
```

A compact memory model:

```text
Strategy        = choose HOW
Observer        = notify WHO
Command         = package WHAT
State           = lifecycle behavior
Template Method = fixed workflow, variable steps
```

# Next: Lesson 24 — Chain of Responsibility

Imagine an incoming API request must go through:

```text
Authentication
    ↓
Authorization
    ↓
Rate Limiting
    ↓
Validation
    ↓
Logging
    ↓
Business Handler
```

You could hardcode:

```java
authenticate();

authorize();

rateLimit();

validate();

handle();
```

But now every caller needs to understand the processing pipeline.

With **Chain of Responsibility**, each handler gets the request and either:

```text
handles it
```

or:

```text
passes it to the next handler
```

Conceptually:

```text
Request
  ↓
Handler A
  ↓
Handler B
  ↓
Handler C
  ↓
Handler D
```

Lesson 24 will cover handler chains, middleware/filter pipelines, short-circuiting, validation chains, authentication pipelines, Servlet/Spring-style filters, and the important distinction between **Chain of Responsibility vs Decorator vs Observer**.
