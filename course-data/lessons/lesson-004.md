# Lesson 4 — Liskov Substitution Principle

The **Liskov Substitution Principle**, or **LSP**, says:

> If class `B` is a subtype of class `A`, then objects of type `B` should be usable wherever `A` is expected without breaking correctness.

A simpler version is:

> A child class should behave in a way that makes sense wherever the parent class is used.

The keyword is:

> **substitutable**

If I replace a parent object with a child object, the program should still behave correctly.

---

# Why this principle exists

Inheritance says:

```text
Dog IS-A Animal
```

But Java allowing:

```java
class Dog extends Animal
```

does not automatically mean the design is correct.

The real question is:

> Can `Dog` safely fulfill every promise made by `Animal`?

If not, the inheritance relationship is questionable.

---

# Simple example

Suppose:

```java
class Animal {

    public void eat() {
        System.out.println("Animal eating");
    }
}
```

Then:

```java
class Dog extends Animal {

    @Override
    public void eat() {
        System.out.println("Dog eating");
    }
}
```

This is fine.

Code expecting an `Animal`:

```java
void feedAnimal(Animal animal) {
    animal.eat();
}
```

works with:

```java
feedAnimal(new Animal());
feedAnimal(new Dog());
```

`Dog` can substitute for `Animal`.

Good LSP.

---

# The classic problem: Bird and Penguin

Suppose we design:

```java
class Bird {

    public void fly() {
        System.out.println("Flying");
    }
}
```

Then:

```java
class Sparrow extends Bird {
}
```

Fine.

Now:

```java
class Penguin extends Bird {

    @Override
    public void fly() {
        throw new UnsupportedOperationException(
            "Penguins cannot fly"
        );
    }
}
```

Technically, Java allows this.

But look at this function:

```java
void makeBirdFly(Bird bird) {
    bird.fly();
}
```

This works:

```java
makeBirdFly(new Sparrow());
```

But fails:

```java
makeBirdFly(new Penguin());
```

So `Penguin` is not safely substitutable for `Bird` as we've defined `Bird`.

That violates LSP.

The problem is not that:

> Penguins aren't birds.

Biologically they are.

The problem is that our software abstraction incorrectly says:

> Every `Bird` can fly.

That's false.

---

# Better design

Instead of:

```text
Bird
 ├── Sparrow
 └── Penguin
```

where `Bird` promises `fly()`, separate the capability.

For example:

```java
abstract class Bird {

    public abstract void eat();
}
```

Then:

```java
interface Flyable {

    void fly();
}
```

Sparrow:

```java
class Sparrow extends Bird
        implements Flyable {

    @Override
    public void eat() {
        System.out.println("Sparrow eating");
    }

    @Override
    public void fly() {
        System.out.println("Sparrow flying");
    }
}
```

Penguin:

```java
class Penguin extends Bird {

    @Override
    public void eat() {
        System.out.println("Penguin eating");
    }

    public void swim() {
        System.out.println("Penguin swimming");
    }
}
```

Now only things that can actually fly implement:

```java
Flyable
```

And:

```java
void makeItFly(Flyable bird) {
    bird.fly();
}
```

can never receive a `Penguin`.

Much better design.

---

# First big lesson from LSP

Don't force child classes to support behavior that doesn't make sense for them.

A dangerous smell is:

```java
@Override
public void someMethod() {
    throw new UnsupportedOperationException();
}
```

Sometimes that exception is legitimate in APIs, but in ordinary domain design it's often a clue that your inheritance hierarchy is wrong.

---

# Another bad smell

Suppose:

```java
class Document {

    public void save() {
        // save document
    }
}
```

Then:

```java
class ReadOnlyDocument extends Document {

    @Override
    public void save() {
        throw new UnsupportedOperationException(
            "Cannot save read-only document"
        );
    }
}
```

Now this:

```java
void updateDocument(Document document) {
    document.save();
}
```

works with some `Document`s but unexpectedly crashes with `ReadOnlyDocument`.

Again, subtype behavior violates the expectation established by the parent.

---

# LSP is about contracts

Think about a class as making promises.

Suppose:

```java
class BankAccount {

    public void withdraw(double amount) {
        // withdraw
    }
}
```

A caller sees:

```java
BankAccount account
```

and assumes:

> This object supports withdrawal according to the `BankAccount` contract.

Now imagine:

```java
class FixedDepositAccount extends BankAccount {

    @Override
    public void withdraw(double amount) {
        throw new UnsupportedOperationException();
    }
}
```

That's suspicious.

If a fixed deposit account doesn't support arbitrary withdrawal, perhaps it should not inherit from an abstraction that promises arbitrary withdrawal.

---

# Better banking design

Maybe:

```java
interface Account {

    double getBalance();
}
```

Then:

```java
interface WithdrawableAccount
        extends Account {

    void withdraw(double amount);
}
```

Savings account:

```java
class SavingsAccount
        implements WithdrawableAccount {

    private double balance;

    @Override
    public double getBalance() {
        return balance;
    }

    @Override
    public void withdraw(double amount) {
        balance -= amount;
    }
}
```

Fixed deposit:

```java
class FixedDepositAccount
        implements Account {

    private double balance;

    @Override
    public double getBalance() {
        return balance;
    }
}
```

Now we model capabilities more accurately.

This will connect strongly to the next principle:

> **Interface Segregation Principle**

---

# The famous Rectangle–Square problem

This is one of the best examples of LSP.

Mathematically:

> A square is a rectangle.

So you might write:

```java
class Rectangle {

    protected int width;
    protected int height;

    public void setWidth(int width) {
        this.width = width;
    }

    public void setHeight(int height) {
        this.height = height;
    }

    public int area() {
        return width * height;
    }
}
```

Then:

```java
class Square extends Rectangle {

    @Override
    public void setWidth(int width) {
        this.width = width;
        this.height = width;
    }

    @Override
    public void setHeight(int height) {
        this.width = height;
        this.height = height;
    }
}
```

At first this seems logical.

A square has equal width and height.

But now look at code written for `Rectangle`:

```java
void resizeRectangle(Rectangle rectangle) {

    rectangle.setWidth(5);
    rectangle.setHeight(10);

    System.out.println(rectangle.area());
}
```

For a regular rectangle:

```java
Rectangle r = new Rectangle();

resizeRectangle(r);
```

Area:

```text
50
```

because:

```text
width = 5
height = 10
```

Now:

```java
Rectangle r = new Square();

resizeRectangle(r);
```

Let's walk through it.

First:

```java
rectangle.setWidth(5);
```

Square becomes:

```text
5 × 5
```

Then:

```java
rectangle.setHeight(10);
```

Square becomes:

```text
10 × 10
```

Area:

```text
100
```

But code expecting `Rectangle` expected:

```text
5 × 10 = 50
```

So substituting a `Square` changes the expected behavior.

LSP is broken.

---

# "But square IS a rectangle!"

Mathematically, yes.

In object-oriented software, though, subtype relationships aren't only about classification.

They are about:

> **behavioral compatibility**

The mutable `Rectangle` abstraction promises:

```text
width can change independently
height can change independently
```

A square cannot honor that promise while remaining a square.

Therefore:

```text
Square extends Rectangle
```

is problematic for this particular mutable API.

---

# Better design

One solution is to avoid this inheritance relationship.

For example:

```java
interface Shape {

    double area();
}
```

Rectangle:

```java
class Rectangle implements Shape {

    private final double width;
    private final double height;

    public Rectangle(
            double width,
            double height) {

        this.width = width;
        this.height = height;
    }

    @Override
    public double area() {
        return width * height;
    }
}
```

Square:

```java
class Square implements Shape {

    private final double side;

    public Square(double side) {
        this.side = side;
    }

    @Override
    public double area() {
        return side * side;
    }
}
```

Now:

```java
void printArea(Shape shape) {
    System.out.println(shape.area());
}
```

works perfectly with either.

This is a better abstraction.

---

# LSP is more than avoiding exceptions

The obvious violation is:

```java
throw new UnsupportedOperationException();
```

But LSP can be violated more subtly.

Consider:

```java
class PaymentProcessor {

    public boolean process(double amount) {
        return true;
    }
}
```

Suppose callers expect:

```text
positive valid amount
→ attempt payment
→ return true/false
```

Now subclass:

```java
class StrangePaymentProcessor
        extends PaymentProcessor {

    @Override
    public boolean process(double amount) {

        if (amount > 100) {
            throw new IllegalArgumentException();
        }

        return true;
    }
}
```

The child added a new restriction:

```text
amount <= 100
```

The parent didn't require that.

So code that works with the parent:

```java
processor.process(500);
```

may unexpectedly break with the subtype.

That's an LSP problem.

---

# Preconditions and postconditions

This introduces a deeper way to understand LSP.

A subtype should generally not:

### Strengthen preconditions

A child shouldn't demand **more** from the caller than the parent does.

If parent accepts:

```text
amount > 0
```

child shouldn't suddenly require:

```text
0 < amount <= 100
```

because callers weren't promised that restriction.

### Weaken postconditions

A child shouldn't promise **less** than its parent.

Suppose parent says:

```java
User getUser(int id)
```

guarantees:

> If the user exists, return a valid fully-loaded `User`.

A subtype shouldn't return:

```text
half-loaded data
null unexpectedly
invalid user object
```

if that violates the parent's contract.

---

# Think in promises

This is a useful LSP mental model:

```text
Parent says:
"If you give me X,
I guarantee Y."
```

A child should not say:

```text
"Actually, I need X + Z."

or:

"I only guarantee half of Y."
```

The child may provide **more**, but shouldn't break the parent's promises.

---

# Example with vehicles

Bad design:

```java
class Vehicle {

    public void startEngine() {
        System.out.println("Engine started");
    }
}
```

Car:

```java
class Car extends Vehicle {
}
```

Fine.

But then:

```java
class Bicycle extends Vehicle {

    @Override
    public void startEngine() {
        throw new UnsupportedOperationException(
            "Bicycles have no engine"
        );
    }
}
```

The problem is obvious.

The parent abstraction is really:

```text
MotorVehicle
```

not:

```text
Vehicle
```

Better:

```java
abstract class Vehicle {
}
```

Then:

```java
interface Motorized {

    void startEngine();
}
```

Car:

```java
class Car extends Vehicle
        implements Motorized {

    public void startEngine() {
        System.out.println("Car started");
    }
}
```

Bicycle:

```java
class Bicycle extends Vehicle {

    public void pedal() {
        System.out.println("Pedaling");
    }
}
```

The abstraction now matches reality better.

---

# LSP often exposes bad abstractions

That's an important insight.

LSP violations often aren't caused by a "bad subclass."

They often reveal that:

> The parent class is promising too much.

For example:

```java
Bird.fly()
```

was the real issue.

Not `Penguin`.

Similarly:

```java
Vehicle.startEngine()
```

was too broad.

Not `Bicycle`.

So when subclasses constantly need exceptions, empty methods, or weird overrides, inspect the parent abstraction.

---

# Empty methods can also violate LSP

Suppose:

```java
abstract class Employee {

    public abstract void work();
}
```

Then:

```java
class Developer extends Employee {

    @Override
    public void work() {
        System.out.println("Writing code");
    }
}
```

Fine.

But:

```java
class RetiredEmployee extends Employee {

    @Override
    public void work() {
        // do nothing
    }
}
```

Now code:

```java
void assignTask(Employee employee) {
    employee.work();
}
```

assumes work occurs.

With `RetiredEmployee`, nothing happens.

Depending on the contract, that may violate substitution.

Again, perhaps `RetiredEmployee` shouldn't be an active `Employee` subtype in that model.

---

# Another real-world example — File storage

Suppose:

```java
interface Storage {

    void write(String data);

    String read();
}
```

Local storage:

```java
class LocalStorage
        implements Storage {

    public void write(String data) {
        // write
    }

    public String read() {
        return "data";
    }
}
```

Now someone creates:

```java
class ReadOnlyStorage
        implements Storage {

    public void write(String data) {
        throw new UnsupportedOperationException();
    }

    public String read() {
        return "data";
    }
}
```

Again, our abstraction is too broad.

Perhaps:

```java
interface ReadableStorage {

    String read();
}
```

and:

```java
interface WritableStorage {

    void write(String data);
}
```

Then:

```java
class LocalStorage
        implements ReadableStorage,
                   WritableStorage {
}
```

while:

```java
class ReadOnlyStorage
        implements ReadableStorage {
}
```

Much cleaner.

Again, we're starting to see the next SOLID principle appear naturally.

---

# Composition can prevent LSP problems

Inheritance can sometimes force inappropriate behavior.

Imagine:

```java
class Bird {

    void fly() {}
}
```

Instead, we might use composition:

```java
interface FlyingBehavior {

    void fly();
}
```

Flying behavior:

```java
class WingFlying
        implements FlyingBehavior {

    public void fly() {
        System.out.println("Flying");
    }
}
```

No-flying behavior:

```java
class CannotFly
        implements FlyingBehavior {

    public void fly() {
        System.out.println("Cannot fly");
    }
}
```

Then:

```java
class Bird {

    private FlyingBehavior flyingBehavior;

    public Bird(
            FlyingBehavior flyingBehavior) {

        this.flyingBehavior =
                flyingBehavior;
    }
}
```

This resembles the **Strategy Pattern**.

Again:

> Favor composition over inheritance.

But be careful: if calling `fly()` on a non-flying bird still violates caller expectations, modeling flying as an optional capability may be better than a `CannotFly` strategy. The right design depends on the domain contract.

---

# Inheritance should model behavior, not just taxonomy

This is important in interviews.

You may see:

```text
Square IS-A Rectangle
Penguin IS-A Bird
Bicycle IS-A Vehicle
```

These statements may be true in everyday classification.

But OOP inheritance asks a stronger question:

> Does the subtype satisfy the behavioral contract of the parent?

So:

```text
Real-world IS-A
```

does not automatically mean:

```text
Java extends
```

---

# LSP and polymorphism

Remember polymorphism?

```java
PaymentMethod method =
        new CardPayment();
```

Later:

```java
method =
        new PayPalPayment();
```

This works because both implementations obey the contract:

```java
interface PaymentMethod {
    void pay(double amount);
}
```

If one implementation does:

```java
throw new UnsupportedOperationException();
```

for ordinary valid payments, polymorphism becomes unreliable.

LSP is what makes polymorphism trustworthy.

That's a very important connection:

```text
Polymorphism
     +
LSP
     =
safe substitution
```

Without LSP, we technically have polymorphism, but callers constantly need to ask:

```java
if (payment instanceof CardPayment) {
    ...
}
```

or:

```java
try {
    payment.pay(...);
} catch (...) {
    ...
}
```

The abstraction stops being useful.

---

# LSP violation often creates `instanceof`

Suppose:

```java
void process(Bird bird) {

    if (bird instanceof Penguin) {
        // don't fly
    } else {
        bird.fly();
    }
}
```

This is a warning sign.

Why?

Because the caller cannot safely trust the `Bird` abstraction.

It has to know specific subtype details.

Often that's evidence that the hierarchy needs redesign.

Not every `instanceof` is wrong, but repeated subtype checking should make you suspicious.

---

# Let's look at a payment example

Suppose:

```java
interface PaymentMethod {

    void pay(double amount);

    void refund(double amount);
}
```

Card:

```java
class CardPayment
        implements PaymentMethod {

    public void pay(double amount) {
        System.out.println("Card payment");
    }

    public void refund(double amount) {
        System.out.println("Card refund");
    }
}
```

Now imagine some payment method cannot refund:

```java
class GiftVoucherPayment
        implements PaymentMethod {

    public void pay(double amount) {
        System.out.println("Voucher payment");
    }

    public void refund(double amount) {
        throw new UnsupportedOperationException(
            "Voucher refunds unsupported"
        );
    }
}
```

This is questionable.

Because callers receiving:

```java
PaymentMethod
```

believe they can call:

```java
refund()
```

But that's not universally true.

Better:

```java
interface PaymentMethod {

    void pay(double amount);
}
```

Then:

```java
interface RefundablePayment
        extends PaymentMethod {

    void refund(double amount);
}
```

Card:

```java
class CardPayment
        implements RefundablePayment {

    public void pay(double amount) {
        ...
    }

    public void refund(double amount) {
        ...
    }
}
```

Voucher:

```java
class GiftVoucherPayment
        implements PaymentMethod {

    public void pay(double amount) {
        ...
    }
}
```

Now the type system helps enforce correctness.

---

# A practical LSP checklist

When designing inheritance, ask:

```text
Can every subclass perform every operation
promised by the parent?
```

Then:

```text
Will valid parent inputs remain valid
for the child?
```

Then:

```text
Does the child preserve expected
outputs and side effects?
```

Then:

```text
Does the child throw unexpected exceptions
for normal parent operations?
```

Then:

```text
Does calling code need instanceof
checks to handle certain children?
```

Then:

```text
Do some subclasses have empty or
unsupported methods?
```

Several "yes" answers suggest an LSP problem.

---

# Let's connect SRP, OCP, and LSP

We now have three principles:

```text
S — Single Responsibility Principle
```

Ask:

> Does this class have one cohesive responsibility?

```text
O — Open/Closed Principle
```

Ask:

> Can expected variations be added without repeatedly changing stable code?

```text
L — Liskov Substitution Principle
```

Ask:

> Can every subtype safely stand in for its parent?

They complement each other.

For example, suppose we have:

```java
interface PaymentMethod {
    void pay(double amount);
}
```

OCP says:

> Add new payment methods by creating new implementations.

But LSP says:

> Those implementations must genuinely honor the `PaymentMethod` contract.

Otherwise OCP alone isn't enough.

---

# Good hierarchy

```text
PaymentMethod
   │
   ├── CardPayment
   ├── PayPalPayment
   ├── UpiPayment
   └── ApplePayPayment
```

All support:

```java
pay(amount)
```

in a meaningful way.

Therefore:

```text
OCP ✓
LSP ✓
```

---

# Bad hierarchy

```text
PaymentMethod
   │
   ├── CardPayment
   ├── PayPalPayment
   └── ReadOnlyPayment
```

where:

```java
ReadOnlyPayment.pay()
```

throws an exception.

Now:

```text
OCP maybe ✓
LSP ✗
```

You extended the abstraction, but with an invalid subtype.

That's an important distinction.

---

# Interview definition

If an interviewer asks:

> What is the Liskov Substitution Principle?

A strong answer:

> LSP states that objects of a subtype should be usable wherever objects of the parent type are expected without breaking the correctness or assumptions of the program. A subtype should honor the behavioral contract of its parent rather than introducing incompatible restrictions or unsupported behavior.

Then give an example:

> If `Bird` exposes `fly()`, making `Penguin` inherit from `Bird` and throw `UnsupportedOperationException` from `fly()` violates LSP. A better model would separate `Bird` from the `Flyable` capability.

That's a strong answer.

---

# Common interview trap

The interviewer may ask:

> "Is Square a Rectangle?"

Don't immediately answer based only on mathematics.

Ask about the API.

If `Rectangle` is immutable and only promises:

```java
area()
```

then both could safely implement:

```java
Shape
```

or possibly share a suitable abstraction.

But if `Rectangle` promises independent:

```java
setWidth()
setHeight()
```

then mutable `Square extends Rectangle` generally breaks that behavioral contract.

That's the kind of reasoning interviewers are looking for.

---

# LSP mental model

Remember this:

```text
Parent type
     │
     │ promises a contract
     ▼
Child type
     │
     └── must honor that contract
```

Not:

```text
"It compiles, therefore inheritance is correct."
```

Compilation tells you:

> Java accepts the type relationship.

LSP asks:

> Does the relationship make behavioral sense?

Those are very different questions.

---

# Mini exercise

Consider:

```java
class MediaPlayer {

    public void playAudio() {
    }

    public void playVideo() {
    }
}
```

Then:

```java
class AudioOnlyPlayer
        extends MediaPlayer {

    @Override
    public void playVideo() {
        throw new UnsupportedOperationException();
    }
}
```

Ask yourself:

> Is `AudioOnlyPlayer` safely substitutable for `MediaPlayer`?

Probably not, because `MediaPlayer` promises video playback.

A better abstraction might be:

```java
interface AudioPlayer {
    void playAudio();
}
```

and:

```java
interface VideoPlayer {
    void playVideo();
}
```

Then a full media player can implement both:

```java
class FullMediaPlayer
        implements AudioPlayer,
                   VideoPlayer {
}
```

while:

```java
class AudioOnlyPlayer
        implements AudioPlayer {
}
```

Clean, explicit, and safer.

---

# What you've learned

The core LSP ideas are:

```text
1. Inheritance is about behavioral compatibility.

2. A child must honor the parent's contract.

3. A child shouldn't unexpectedly reject valid
   parent operations.

4. A child shouldn't unexpectedly provide weaker
   behavior than the parent promises.

5. Unsupported methods are often a design smell.

6. Repeated instanceof checks may signal a bad
   abstraction.

7. Real-world IS-A does not automatically imply
   Java extends.

8. Good abstractions make polymorphism trustworthy.
```

And here's the big sentence to remember:

> **A subtype should be boring to the caller.**

If the caller needs special logic just because a particular subtype arrived, your abstraction may be broken.

---

# Next: Lesson 5 — Interface Segregation Principle

LSP naturally leads into our next principle.

Consider this interface:

```java
interface Worker {

    void work();

    void eat();

    void sleep();

    void attendMeeting();

    void writeCode();

    void driveTruck();
}
```

Now imagine:

```text
Developer
TruckDriver
Robot
Manager
```

all have to implement it.

You'll immediately run into methods that don't apply to certain classes.

The **Interface Segregation Principle** solves exactly this problem:

> **Clients should not be forced to depend on methods they do not use.**

And once we understand ISP, we'll be only one principle away from completing SOLID: **Dependency Inversion Principle**, arguably the principle most directly connected to dependency injection, Spring, testability, and many design patterns.
