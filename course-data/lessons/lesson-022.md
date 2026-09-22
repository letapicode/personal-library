# Lesson 22 — State Pattern

The **State Pattern** is used when an object's behavior changes depending on its current internal state.

The core idea is:

> Represent each state as a separate object, and delegate state-dependent behavior to the current state object.

This is especially useful when you have many conditions like:

```java
if (state == A) {
    ...
} else if (state == B) {
    ...
} else if (state == C) {
    ...
}
```

repeated across multiple methods.

State turns that conditional logic into polymorphism.

---

# 1. Start with the problem

Imagine a vending machine.

It can be in states such as:

```text
NoCoin
HasCoin
Dispensing
OutOfStock
```

It supports operations:

```text
insertCoin()
selectItem()
dispense()
refund()
```

A naive implementation might look like this:

```java
class VendingMachine {

    enum State {
        NO_COIN,
        HAS_COIN,
        DISPENSING,
        OUT_OF_STOCK
    }

    private State state =
            State.NO_COIN;

    public void insertCoin() {

        if (state == State.NO_COIN) {

            System.out.println(
                "Coin inserted"
            );

            state =
                State.HAS_COIN;

        } else if (
            state == State.HAS_COIN) {

            System.out.println(
                "Coin already inserted"
            );

        } else if (
            state == State.DISPENSING) {

            System.out.println(
                "Please wait"
            );

        } else if (
            state ==
                State.OUT_OF_STOCK) {

            System.out.println(
                "Machine out of stock"
            );
        }
    }
}
```

That is already getting messy.

Now imagine doing the same conditional logic in:

```java
selectItem()
dispense()
refund()
```

You get repeated state checks everywhere.

---

# 2. The real problem

The issue isn't that `if` statements are inherently bad.

The problem is:

> Behavior is heavily dependent on state, and state-specific logic is scattered across the class.

You may end up with:

```text
insertCoin()
    → 4 state branches

selectItem()
    → 4 state branches

dispense()
    → 4 state branches

refund()
    → 4 state branches
```

Now add a new state:

```text
Maintenance
```

You may need to modify every one of those methods.

That hurts maintainability and OCP.

---

# 3. State Pattern idea

Instead of asking:

```java
if (state == NO_COIN)
```

we let the current state object decide what happens.

Define:

```java
interface VendingMachineState {

    void insertCoin(
        VendingMachine machine
    );

    void selectItem(
        VendingMachine machine
    );

    void dispense(
        VendingMachine machine
    );

    void refund(
        VendingMachine machine
    );
}
```

Then each state implements the behavior appropriate for that state.

---

# 4. Context

The main object is called the:

> **Context**

Here:

```java
VendingMachine
```

is the Context.

It stores the current state:

```java
class VendingMachine {

    private VendingMachineState state;

    public VendingMachine() {

        this.state =
            new NoCoinState();
    }

    public void setState(
            VendingMachineState state) {

        this.state = state;
    }

    public void insertCoin() {

        state.insertCoin(this);
    }

    public void selectItem() {

        state.selectItem(this);
    }

    public void dispense() {

        state.dispense(this);
    }

    public void refund() {

        state.refund(this);
    }
}
```

Notice:

```java
VendingMachine
```

contains no giant `if/else`.

It simply delegates to the current state.

---

# 5. `NoCoinState`

```java
class NoCoinState
        implements VendingMachineState {

    @Override
    public void insertCoin(
            VendingMachine machine) {

        System.out.println(
            "Coin accepted"
        );

        machine.setState(
            new HasCoinState()
        );
    }

    @Override
    public void selectItem(
            VendingMachine machine) {

        System.out.println(
            "Insert coin first"
        );
    }

    @Override
    public void dispense(
            VendingMachine machine) {

        System.out.println(
            "Cannot dispense"
        );
    }

    @Override
    public void refund(
            VendingMachine machine) {

        System.out.println(
            "No coin to refund"
        );
    }
}
```

This class contains behavior for exactly one state:

```text
NO_COIN
```

---

# 6. `HasCoinState`

```java
class HasCoinState
        implements VendingMachineState {

    @Override
    public void insertCoin(
            VendingMachine machine) {

        System.out.println(
            "Coin already inserted"
        );
    }

    @Override
    public void selectItem(
            VendingMachine machine) {

        System.out.println(
            "Item selected"
        );

        machine.setState(
            new DispensingState()
        );
    }

    @Override
    public void dispense(
            VendingMachine machine) {

        System.out.println(
            "Select item first"
        );
    }

    @Override
    public void refund(
            VendingMachine machine) {

        System.out.println(
            "Coin refunded"
        );

        machine.setState(
            new NoCoinState()
        );
    }
}
```

---

# 7. `DispensingState`

```java
class DispensingState
        implements VendingMachineState {

    @Override
    public void insertCoin(
            VendingMachine machine) {

        System.out.println(
            "Please wait"
        );
    }

    @Override
    public void selectItem(
            VendingMachine machine) {

        System.out.println(
            "Already dispensing"
        );
    }

    @Override
    public void dispense(
            VendingMachine machine) {

        System.out.println(
            "Dispensing item"
        );

        machine.setState(
            new NoCoinState()
        );
    }

    @Override
    public void refund(
            VendingMachine machine) {

        System.out.println(
            "Cannot refund while dispensing"
        );
    }
}
```

Now the machine's behavior depends on the object currently stored in:

```java
state
```

---

# 8. Usage

```java
VendingMachine machine =
        new VendingMachine();

machine.insertCoin();
machine.selectItem();
machine.dispense();
```

The flow is:

```text
NoCoinState
    |
    | insertCoin()
    v
HasCoinState
    |
    | selectItem()
    v
DispensingState
    |
    | dispense()
    v
NoCoinState
```

The state transition itself changes future behavior.

That is the essence of State.

---

# 9. State Pattern structure

The pattern usually has:

### Context

```java
VendingMachine
```

### State interface

```java
VendingMachineState
```

### Concrete states

```text
NoCoinState
HasCoinState
DispensingState
OutOfStockState
```

Conceptually:

```text
            State
          /   |    \
         /    |     \
    NoCoin HasCoin Dispensing
         \    |     /
          \   |    /
            Context
```

More accurately:

```text
Context
   |
   | has current
   v
State
```

and states may transition the Context to another State.

---

# 10. State Pattern is polymorphism over lifecycle

This is a useful way to think about it.

Strategy is polymorphism over:

```text
algorithm
```

State is polymorphism over:

```text
lifecycle state
```

For State:

```java
machine.insertCoin();
```

may behave differently depending on whether the machine is:

```text
NoCoin
HasCoin
Dispensing
OutOfStock
```

The method call stays the same.

The current state determines behavior.

---

# 11. State vs Strategy

This is the most important comparison.

Structurally:

```java
class Context {
    private Strategy strategy;
}
```

and:

```java
class Context {
    private State state;
}
```

look nearly identical.

But the intention is different.

Strategy:

> Choose an algorithm.

State:

> Change behavior because the object is in a different state.

Strategy example:

```text
Payment algorithm:
Card
PayPal
Crypto
```

State example:

```text
Order lifecycle:
Created
Paid
Shipped
Delivered
```

---

# 12. Who chooses?

Strategy is often chosen externally:

```java
service.setStrategy(
    new CardPayment()
);
```

State often changes internally because something happened:

```text
Created
   ↓ pay()
Paid
   ↓ ship()
Shipped
```

A good mental rule:

```text
Strategy
→ caller/config chooses behavior

State
→ lifecycle/events drive behavior
```

Not an absolute law, but very useful.

---

# 13. Order workflow example

Orders are excellent State candidates.

Suppose an order can be:

```text
Created
Paid
Shipped
Delivered
Cancelled
```

Operations might include:

```text
pay()
ship()
deliver()
cancel()
```

With enum conditionals, you might write:

```java
if (state == CREATED) {
    ...
} else if (state == PAID) {
    ...
}
```

across every method.

Instead, use State.

---

# 14. Order state interface

```java
interface OrderState {

    void pay(Order order);

    void ship(Order order);

    void deliver(Order order);

    void cancel(Order order);
}
```

Context:

```java
class Order {

    private OrderState state;

    public Order() {
        state =
            new CreatedState();
    }

    void setState(
            OrderState state) {

        this.state = state;
    }

    public void pay() {
        state.pay(this);
    }

    public void ship() {
        state.ship(this);
    }

    public void deliver() {
        state.deliver(this);
    }

    public void cancel() {
        state.cancel(this);
    }
}
```

---

# 15. `CreatedState`

```java
class CreatedState
        implements OrderState {

    @Override
    public void pay(Order order) {

        System.out.println(
            "Payment completed"
        );

        order.setState(
            new PaidState()
        );
    }

    @Override
    public void ship(Order order) {

        throw new IllegalStateException(
            "Cannot ship unpaid order"
        );
    }

    @Override
    public void deliver(Order order) {

        throw new IllegalStateException(
            "Cannot deliver unshipped order"
        );
    }

    @Override
    public void cancel(Order order) {

        System.out.println(
            "Order cancelled"
        );

        order.setState(
            new CancelledState()
        );
    }
}
```

---

# 16. `PaidState`

```java
class PaidState
        implements OrderState {

    @Override
    public void pay(Order order) {

        throw new IllegalStateException(
            "Already paid"
        );
    }

    @Override
    public void ship(Order order) {

        System.out.println(
            "Order shipped"
        );

        order.setState(
            new ShippedState()
        );
    }

    @Override
    public void deliver(Order order) {

        throw new IllegalStateException(
            "Order not shipped yet"
        );
    }

    @Override
    public void cancel(Order order) {

        System.out.println(
            "Refund payment"
        );

        order.setState(
            new CancelledState()
        );
    }
}
```

Now each state owns its own valid behavior and transitions.

---

# 17. State transition diagram

For the order:

```text
        pay
Created ------> Paid
   |              |
   | cancel       | ship
   v              v
Cancelled       Shipped
                  |
                  | deliver
                  v
               Delivered
```

This is a **finite-state machine**.

State Pattern is often a natural object-oriented implementation of finite-state-machine behavior.

---

# 18. Finite-State Machine

A finite-state machine has:

```text
finite set of states
events
transitions
behavior/rules
```

Example:

```text
State:
Paid

Event:
ship

Transition:
Paid → Shipped
```

State Pattern gives each state a class/object.

So instead of:

```text
(state, event) lookup
```

we use polymorphism:

```java
state.ship(order);
```

---

# 19. Invalid transitions

Suppose:

```text
Delivered → pay
```

should never happen.

The state object can reject it:

```java
class DeliveredState
        implements OrderState {

    @Override
    public void pay(Order order) {

        throw new IllegalStateException(
            "Order already completed"
        );
    }

    ...
}
```

State becomes a natural place to enforce valid lifecycle transitions.

---

# 20. But should invalid operations even exist?

Good design question.

If every state interface contains:

```java
pay()
ship()
deliver()
cancel()
```

some states may support only one or two operations.

Then many methods might just throw exceptions.

That can look like an ISP/LSP smell.

Sometimes it's still acceptable for a state machine because the Context intentionally exposes a stable event API.

But if the interface becomes enormous, reconsider the design.

You might instead model generic events or smaller capabilities.

---

# 21. Generic event-based State model

Instead of:

```java
interface OrderState {
    void pay();
    void ship();
    void deliver();
}
```

you might have:

```java
interface OrderState {

    OrderState handle(
        OrderEvent event
    );
}
```

Where:

```java
enum OrderEvent {
    PAY,
    SHIP,
    DELIVER,
    CANCEL
}
```

Then:

```java
class PaidState
        implements OrderState {

    @Override
    public OrderState handle(
            OrderEvent event) {

        return switch (event) {

            case SHIP ->
                new ShippedState();

            case CANCEL ->
                new CancelledState();

            default ->
                throw new
                    IllegalStateException();
        };
    }
}
```

This can be useful when the number of events is large or the state machine is data-driven.

---

# 22. Where should transitions happen?

There are two main approaches.

### State controls transition

Example:

```java
machine.setState(
    new HasCoinState()
);
```

inside `NoCoinState`.

Advantage:

```text
transition logic stays with state behavior
```

### Context controls transition

State returns some result:

```java
OrderState next =
        state.pay();

this.state = next;
```

Advantage:

```text
Context retains lifecycle control
```

Both are valid.

Choose based on clarity and how much authority states should have.

---

# 23. Returning next state

One clean style is:

```java
interface OrderState {

    OrderState pay();

    OrderState ship();
}
```

Example:

```java
class CreatedState
        implements OrderState {

    @Override
    public OrderState pay() {

        return new PaidState();
    }

    @Override
    public OrderState ship() {

        throw new IllegalStateException();
    }
}
```

Then:

```java
class Order {

    private OrderState state;

    public void pay() {

        state = state.pay();
    }
}
```

This avoids passing the Context into every state method.

---

# 24. State objects can be immutable and shared

Suppose:

```java
NoCoinState
```

has no state of its own.

Instead of repeatedly doing:

```java
new NoCoinState()
```

you could reuse one immutable instance.

For example:

```java
enum NoCoinState
        implements VendingMachineState {

    INSTANCE;

    ...
}
```

or use static constants.

This can reduce allocations.

But don't optimize prematurely.

The main design concern is clarity.

---

# 25. State can contain state-specific data

Sometimes a concrete state needs data.

Suppose a download can be:

```text
NotStarted
Downloading
Paused
Completed
```

`DownloadingState` might contain:

```text
bytesDownloaded
speed
startedAt
```

Then State objects aren't just marker objects.

They can carry information specific to that lifecycle state.

---

# 26. TCP-style connection example

Imagine:

```text
Disconnected
Connecting
Connected
Closing
```

Calling:

```java
connection.send(data);
```

in `DisconnectedState` should fail.

In `ConnectedState` it should actually send.

Instead of:

```java
if (state == CONNECTED)
```

everywhere, the State object handles it.

This is a natural use case.

---

# 27. Document workflow example

Suppose a document can be:

```text
Draft
UnderReview
Approved
Published
Archived
```

Operations:

```text
edit
submit
approve
publish
archive
```

A `PublishedState` might allow:

```text
archive
```

but reject:

```text
edit
approve
```

Again, lifecycle rules belong naturally inside state-specific behavior.

---

# 28. Media player example

States:

```text
Stopped
Playing
Paused
```

Button:

```text
playPause()
```

Behavior depends on current state.

For example:

```text
Stopped + playPause
→ Playing

Playing + playPause
→ Paused

Paused + playPause
→ Playing
```

Instead of:

```java
if (state == STOPPED) ...
else if (state == PLAYING) ...
```

the current State handles it.

---

# 29. Traffic light example

States:

```text
Red
Green
Yellow
```

Transitions:

```text
Red → Green
Green → Yellow
Yellow → Red
```

Interface:

```java
interface TrafficLightState {

    TrafficLightState next();

    void display();
}
```

Red:

```java
class RedState
        implements TrafficLightState {

    @Override
    public TrafficLightState next() {

        return new GreenState();
    }

    @Override
    public void display() {

        System.out.println("RED");
    }
}
```

Then:

```java
state = state.next();
```

Very clean.

---

# 30. State vs enum

Important question:

> Do I always need classes for states?

No.

If state logic is simple:

```java
enum OrderStatus {
    CREATED,
    PAID,
    SHIPPED,
    DELIVERED
}
```

may be completely sufficient.

Use State when behavior is substantial and conditional logic is spreading.

A simple enum is often better when:

```text
few states
few transitions
little state-specific behavior
```

---

# 31. State using enum methods

Java enums can themselves implement State-like polymorphism.

For example:

```java
enum TrafficLight {

    RED {
        @Override
        TrafficLight next() {
            return GREEN;
        }
    },

    GREEN {
        @Override
        TrafficLight next() {
            return YELLOW;
        }
    },

    YELLOW {
        @Override
        TrafficLight next() {
            return RED;
        }
    };

    abstract TrafficLight next();
}
```

Now:

```java
TrafficLight state =
        TrafficLight.RED;

state = state.next();
```

This is still very State-like.

For simple finite state machines, enum-based implementations can be elegant.

---

# 32. When separate classes are better

Use separate state classes when states have:

```text
complex logic
dependencies
state-specific data
many operations
independent testing needs
significant domain meaning
```

Example:

```java
class FraudReviewState
        implements PaymentState {

    private final FraudService fraudService;

    ...
}
```

A class handles that much better than a giant enum constant.

---

# 33. State and OCP

Suppose we add:

```text
MaintenanceState
```

We can create:

```java
class MaintenanceState
        implements VendingMachineState {
    ...
}
```

Ideally, the Context doesn't need major changes.

The behavior is encapsulated in the new state class.

That's OCP.

Though transitions from existing states may still need to know how to enter the new state depending on your design.

---

# 34. State and SRP

Without State:

```java
class VendingMachine {

    // machine data
    // NoCoin logic
    // HasCoin logic
    // Dispensing logic
    // OutOfStock logic
}
```

With State:

```text
VendingMachine
→ owns machine-level data and current state

NoCoinState
→ NoCoin behavior

HasCoinState
→ HasCoin behavior

DispensingState
→ Dispensing behavior
```

Much cleaner.

---

# 35. State and LSP

Every state implementation must correctly honor the contract of the State interface.

But this requires nuance because some operations may genuinely be invalid in some states.

The abstraction needs to define what invalid transitions mean:

```text
throw exception
ignore
return failure
transition elsewhere
```

That behavior should be consistent and documented.

---

# 36. State and DIP

The Context depends on:

```java
OrderState
```

not:

```java
PaidState
```

for normal behavior.

So the Context delegates through an abstraction.

That's DIP-style decoupling.

---

# 37. State vs Strategy again

Let's lock this in.

Strategy:

```text
NavigationService
   |
   v
RouteStrategy
```

You might choose:

```text
Fastest
Shortest
Scenic
```

because the user prefers one algorithm.

State:

```text
Order
  |
  v
OrderState
```

Current object lifecycle determines:

```text
Created
Paid
Shipped
Delivered
```

A Strategy isn't normally saying:

> "Because I used FastestRoute, next I automatically become ScenicRoute."

State commonly includes transitions.

That's the key difference.

---

# 38. State vs Command

Command represents:

```text
an action
```

State represents:

```text
current lifecycle mode
```

For example:

```text
Command:
ShipOrderCommand

State:
PaidState
```

`ShipOrderCommand` may execute:

```java
order.ship();
```

Then `PaidState` decides whether that action is valid and transitions to:

```text
ShippedState
```

The two patterns work together nicely.

---

# 39. State vs Observer

State handles internal behavior changes.

Observer notifies external listeners.

For example:

```text
Order
PaidState
   |
   | ship()
   v
ShippedState
```

Then the order may publish:

```text
OrderShipped
```

to observers:

```text
Email
Analytics
Tracking
```

State determines lifecycle.

Observer announces events.

---

# 40. State vs Chain of Responsibility

State:

> Exactly one current state generally controls behavior.

Chain:

> A request passes through multiple possible handlers.

State:

```text
Context
  ↓
one current State
```

Chain:

```text
Handler A
   ↓
Handler B
   ↓
Handler C
```

Very different intent.

---

# 41. State transition table

Before coding, it can be useful to write a transition table.

For example:

| Current state | Event | Next state |
|---|---|---|
| Created | pay | Paid |
| Created | cancel | Cancelled |
| Paid | ship | Shipped |
| Paid | cancel | Cancelled |
| Shipped | deliver | Delivered |
| Delivered | cancel | Invalid |

This is extremely useful during LLD interviews.

It forces you to make lifecycle rules explicit before creating classes.

---

# 42. Use transition diagrams in interviews

For a vending machine:

```text
NoCoin
   |
 insertCoin
   v
HasCoin
   |
 selectItem
   v
Dispensing
   |
 dispense
   v
NoCoin
```

Plus:

```text
HasCoin
   |
 refund
   v
NoCoin
```

Interviewers often care more about whether you model the lifecycle correctly than whether you memorize the exact GoF class names.

---

# 43. Example: payment lifecycle

Imagine:

```text
Created
Authorized
Captured
Refunded
Failed
```

Possible transitions:

```text
Created
  |
 authorize
  v
Authorized
  |
 capture
  v
Captured
  |
 refund
  v
Refunded
```

A failed authorization:

```text
Created
  |
 authorize fails
  v
Failed
```

This is very natural State modeling.

---

# 44. Concurrency becomes important

Suppose two threads call:

```text
ship()
cancel()
```

on the same order simultaneously.

Both may see:

```text
PaidState
```

and attempt different transitions.

You can get inconsistent state.

For stateful domain objects, concurrency control may be needed:

```text
synchronization
database locking
optimistic versioning
transactions
compare-and-set
```

State Pattern itself doesn't solve concurrency.

It only organizes state-dependent behavior.

---

# 45. Persistence concern

Suppose an order is stored in a database as:

```text
status = "PAID"
```

When loading it, you need to reconstruct the correct state object.

For example:

```java
OrderState state =
        switch (status) {

            case CREATED ->
                new CreatedState();

            case PAID ->
                new PaidState();

            case SHIPPED ->
                new ShippedState();

            default ->
                throw new
                    IllegalArgumentException();
        };
```

This mapping is often kept at a repository/mapper boundary.

Don't necessarily persist Java implementation class names directly.

Persist domain state values.

---

# 46. State factories

You could centralize state creation:

```java
class OrderStateFactory {

    public OrderState from(
            OrderStatus status) {

        return switch (status) {

            case CREATED ->
                new CreatedState();

            case PAID ->
                new PaidState();

            case SHIPPED ->
                new ShippedState();

            case DELIVERED ->
                new DeliveredState();

            case CANCELLED ->
                new CancelledState();
        };
    }
}
```

Factory + State can work together.

---

# 47. State transitions and side effects

Suppose shipping an order requires:

```text
validate payment
reserve courier
persist state
publish event
```

Should all of that live inside `PaidState.ship()`?

Maybe not.

The State should own:

```text
state-specific rules and transition decision
```

but infrastructure side effects may belong in application services.

A possible design:

```java
class Order {

    public OrderEvent ship() {
        return state.ship(this);
    }
}
```

Then an application service handles:

```text
repository.save(order)
eventPublisher.publish(event)
```

Keep domain logic separate from infrastructure when possible.

---

# 48. State is not a license for one class per enum value

Suppose you have:

```text
ACTIVE
INACTIVE
```

and the only difference is:

```java
if (active) {
    ...
}
```

Creating:

```text
ActiveState
InactiveState
StateContext
StateFactory
```

may be overkill.

State Pattern earns its complexity when lifecycle behavior is substantial.

---

# 49. State explosion

The opposite problem can also happen.

Suppose you encode every tiny combination as a state:

```text
PaidAndVerifiedAndEmailSentState
PaidAndVerifiedButEmailNotSentState
PaidButNotVerifiedState
...
```

That can explode combinatorially.

Sometimes these are actually independent dimensions and should be modeled separately.

This is similar to the Bridge lesson:

> Don't collapse independent dimensions into one state machine.

---

# 50. Orthogonal state dimensions

Imagine a media upload has:

```text
Upload state:
Uploading
Completed
Failed
```

and separately:

```text
Visibility:
Private
Public
Unlisted
```

These are independent.

Don't create:

```text
UploadingPrivate
UploadingPublic
CompletedPrivate
CompletedPublic
...
```

Model them separately.

State should represent a meaningful lifecycle dimension.

---

# 51. Common mistake: Context still full of conditionals

Bad:

```java
class Order {

    private OrderState state;

    public void ship() {

        if (state instanceof PaidState) {
            ...
        }
    }
}
```

Now you have State objects but still use type checks.

That defeats the point.

Prefer:

```java
state.ship(this);
```

Let polymorphism handle the behavior.

---

# 52. Common mistake: state objects doing unrelated work

Bad:

```java
class PaidState {

    void ship() {

        sendEmail();
        generateReport();
        updateAnalytics();
        backupDatabase();
    }
}
```

State should focus on lifecycle-specific behavior.

Use services/observers/commands for unrelated responsibilities.

---

# 53. Common mistake: transition logic scattered everywhere

Suppose:

```text
Controller changes state
Repository changes state
State object changes state
Service changes state
```

Now nobody knows who owns transitions.

Choose a clear transition owner.

Often:

```text
Context + State objects
```

should own lifecycle transitions.

External code should request actions:

```java
order.ship();
```

rather than directly do:

```java
order.setState(new ShippedState());
```

---

# 54. Hide `setState` when possible

Instead of:

```java
public void setState(...)
```

you may make it:

```java
void transitionTo(
        OrderState newState) {
    ...
}
```

package-private or private-ish depending on design.

The outside world should not arbitrarily say:

```java
order.setState(
    new DeliveredState()
);
```

That bypasses business rules.

External callers should perform domain actions.

---

# 55. State objects can validate transitions

For example:

```java
class PaidState
        implements OrderState {

    @Override
    public OrderState ship() {

        return new ShippedState();
    }

    @Override
    public OrderState deliver() {

        throw new IllegalStateException(
            "Cannot deliver before shipping"
        );
    }
}
```

This gives you a clear place for transition invariants.

---

# 56. State Pattern and encapsulation

The order should ideally prevent:

```text
invalid lifecycle combinations
```

For example:

```text
state = DELIVERED
but payment = false
```

State can help protect invariants by making transitions explicit.

Encapsulation is not just hiding fields.

It's also protecting valid object states.

---

# 57. Testing states independently

One major advantage is focused testing.

For `PaidState`:

```text
pay
→ rejected

ship
→ Shipped

cancel
→ Cancelled

deliver
→ rejected
```

You can test each state's rules directly.

This is much cleaner than exercising a giant conditional-heavy class for every combination.

---

# 58. Transition matrix testing

You can even build tests around a transition table:

```text
Created + pay      → Paid
Created + ship     → error
Paid + ship        → Shipped
Shipped + deliver  → Delivered
Delivered + cancel → error
```

This is a strong testing strategy for state machines.

---

# 59. Recognition clues

Think State when requirements say:

```text
"Behavior depends heavily on current status."

"There are many lifecycle states."

"Valid operations differ by state."

"The object transitions between states."

"There are repeated if/switch statements
checking status."

"Adding a new state requires changes
in many methods."
```

The strongest recognition question is:

> **Does the same operation behave differently depending on the object's current lifecycle state?**

If yes, State is a strong candidate.

---

# 60. Interview answer

If asked:

> What is the State Pattern?

A strong answer is:

> State is a behavioral design pattern that allows an object to change its behavior when its internal state changes. Instead of using large conditional statements based on state, each state is represented by an object implementing a common interface, and the context delegates state-dependent behavior to its current state.

Then give the vending-machine example:

> A vending machine can delegate `insertCoin()`, `selectItem()`, and `dispense()` to `NoCoinState`, `HasCoinState`, or `DispensingState`, with each state controlling valid behavior and transitions.

---

# 61. Strategy vs State interview answer

A strong answer:

> Strategy and State can have similar structures because both use composition and polymorphism. Strategy represents interchangeable algorithms usually selected by a client or configuration, while State represents lifecycle-dependent behavior and usually includes transitions between states.

That's a very common interview question.

---

# 62. Mental model

Remember:

```text
Context
   |
   | current
   v
 State
   |
   +--> behavior
   +--> transition
```

And:

```text
Event occurs
     |
     v
Current State handles it
     |
     v
Possibly changes to Next State
```

The key word is:

> **lifecycle**

---

# Behavioral patterns so far

We've now covered:

```text
Strategy
→ choose interchangeable algorithm

Observer
→ notify multiple listeners

Command
→ package an action as an object

State
→ change behavior based on lifecycle state
```

A compact mental model:

```text
Strategy = HOW

Observer = WHO reacts

Command = WHAT action

State = WHERE in lifecycle
```

# Next: Lesson 23 — Template Method Pattern

Template Method solves a different problem.

Imagine several data processors all follow the same workflow:

```text
read data
validate
transform
save
```

but each one performs some steps differently.

A naive design duplicates the workflow:

```java
CsvProcessor.process()
JsonProcessor.process()
XmlProcessor.process()
```

with nearly identical orchestration.

Template Method lets a base class define the algorithm skeleton:

```java
public final void process() {

    read();

    validate();

    transform();

    save();
}
```

while subclasses customize selected steps:

```text
CsvProcessor
JsonProcessor
XmlProcessor
```

So **Lesson 23 — Template Method** will cover inheritance-based algorithm reuse, hooks, abstract vs concrete steps, `final` template methods, Template Method vs Strategy, and when inheritance is actually the right tool.
