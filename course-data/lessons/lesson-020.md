# Lesson 20 — Observer Pattern

The **Observer Pattern** is used when one object changes and **multiple other objects need to be notified automatically**.

The core idea is:

> One object publishes changes, and many subscribed objects react to those changes.

This is one of the most common patterns behind:

```text
event listeners
UI callbacks
notifications
stock-price updates
domain events
message subscriptions
reactive systems
```

---

# 1. Start with the problem

Imagine a stock:

```java
class Stock {

    private double price;
}
```

Whenever the price changes, several things should happen:

```text
Mobile app updates
Email alert checks threshold
Trading dashboard refreshes
Analytics system records the change
```

A bad design might be:

```java
class Stock {

    private double price;

    private MobileApp mobileApp;
    private EmailAlert emailAlert;
    private TradingDashboard dashboard;
    private AnalyticsSystem analytics;

    public void setPrice(double price) {

        this.price = price;

        mobileApp.update(price);
        emailAlert.update(price);
        dashboard.update(price);
        analytics.record(price);
    }
}
```

This works.

But now `Stock` knows every concrete listener.

That's tight coupling.

---

# 2. What happens when requirements grow?

Suppose tomorrow we add:

```text
SMS alert
Webhook
Audit logger
Risk engine
AI prediction service
```

Now we keep modifying:

```java
Stock
```

to add:

```java
smsAlert.update(...);
webhook.send(...);
riskEngine.evaluate(...);
```

The publisher becomes tightly coupled to all consumers.

This hurts OCP and DIP.

---

# 3. Observer introduces an abstraction

Instead of `Stock` knowing concrete listeners, we define:

```java
interface StockObserver {

    void update(double price);
}
```

Now every interested object implements the same contract.

---

# 4. Concrete observers

Mobile app:

```java
class MobileApp
        implements StockObserver {

    @Override
    public void update(double price) {

        System.out.println(
            "Mobile app: "
            + price
        );
    }
}
```

Email alert:

```java
class EmailAlert
        implements StockObserver {

    @Override
    public void update(double price) {

        if (price > 150) {

            System.out.println(
                "Email alert: price above 150"
            );
        }
    }
}
```

Dashboard:

```java
class TradingDashboard
        implements StockObserver {

    @Override
    public void update(double price) {

        System.out.println(
            "Dashboard updated: "
            + price
        );
    }
}
```

---

# 5. The Subject / Publisher

Now `Stock` keeps a collection of observers:

```java
class Stock {

    private double price;

    private final List<StockObserver>
            observers =
            new ArrayList<>();

    public void subscribe(
            StockObserver observer) {

        observers.add(observer);
    }

    public void unsubscribe(
            StockObserver observer) {

        observers.remove(observer);
    }

    public void setPrice(double price) {

        this.price = price;

        notifyObservers();
    }

    private void notifyObservers() {

        for (StockObserver observer
                : observers) {

            observer.update(price);
        }
    }
}
```

Now `Stock` knows only:

```java
StockObserver
```

not the concrete implementations.

---

# 6. Usage

```java
Stock stock =
        new Stock();

StockObserver mobile =
        new MobileApp();

StockObserver email =
        new EmailAlert();

StockObserver dashboard =
        new TradingDashboard();
```

Subscribe:

```java
stock.subscribe(mobile);
stock.subscribe(email);
stock.subscribe(dashboard);
```

Change price:

```java
stock.setPrice(160);
```

All observers are notified.

Conceptually:

```text
Stock
  |
  +--> MobileApp
  |
  +--> EmailAlert
  |
  +--> TradingDashboard
```

---

# 7. Terminology

The classic Observer pattern has:

### Subject / Publisher

The object being observed.

Here:

```java
Stock
```

### Observer / Subscriber

The common listener interface:

```java
StockObserver
```

### Concrete Observers

Examples:

```text
MobileApp
EmailAlert
TradingDashboard
```

The publisher maintains subscriptions and notifies observers.

---

# 8. Structure

```text
              Observer
              /  |   \
             /   |    \
        Mobile Email Dashboard
             \   |   /
              \  |  /
               Stock
              Subject
```

More accurately:

```text
Subject
  |
  | stores
  v
List<Observer>
```

and when state changes:

```text
Subject
   |
   | notify()
   v
Observer A
Observer B
Observer C
```

---

# 9. The key benefit

The publisher does not care what observers do.

It only knows:

```java
observer.update(...)
```

The observer might:

```text
update UI
send email
write database record
trigger analytics
publish another event
```

The publisher doesn't need to know.

That's loose coupling.

---

# 10. Observer and OCP

Suppose we add:

```java
class SmsAlert
        implements StockObserver {

    @Override
    public void update(double price) {

        System.out.println(
            "SMS: " + price
        );
    }
}
```

Then:

```java
stock.subscribe(
    new SmsAlert()
);
```

Did `Stock` change?

No.

That's OCP.

---

# 11. Observer and DIP

`Stock` depends on:

```java
StockObserver
```

instead of:

```text
EmailAlert
MobileApp
TradingDashboard
```

That's Dependency Inversion.

---

# 12. Observer and SRP

Without Observer, `Stock` might be responsible for:

```text
stock state
email
UI updates
analytics
SMS
webhooks
```

With Observer:

```text
Stock
→ stock state + publishing changes

EmailAlert
→ email reaction

Dashboard
→ UI reaction

AnalyticsObserver
→ analytics reaction
```

Responsibilities are much cleaner.

---

# 13. Push model

Our first version uses:

```java
observer.update(price);
```

The subject **pushes** data to the observer.

That's called the:

> **Push model**

Example:

```java
interface StockObserver {

    void update(double price);
}
```

Subject says:

> Here's the new price.

This is simple.

---

# 14. Push model with richer event data

Maybe observers need:

```text
old price
new price
symbol
timestamp
```

Instead of adding more parameters:

```java
update(
    symbol,
    oldPrice,
    newPrice,
    timestamp
);
```

create an event object:

```java
record StockPriceChanged(
    String symbol,
    double oldPrice,
    double newPrice
) {}
```

Observer:

```java
interface StockObserver {

    void update(
        StockPriceChanged event
    );
}
```

Subject:

```java
observer.update(
    new StockPriceChanged(
        symbol,
        oldPrice,
        newPrice
    )
);
```

This scales better.

---

# 15. Pull model

Another approach is:

```java
interface StockObserver {

    void update(Stock stock);
}
```

Then the observer receives the subject and asks for what it needs:

```java
class Dashboard
        implements StockObserver {

    @Override
    public void update(
            Stock stock) {

        System.out.println(
            stock.getPrice()
        );
    }
}
```

This is a:

> **Pull model**

The observer pulls relevant data from the subject.

---

# 16. Push vs pull

Push:

```java
observer.update(event);
```

Advantages:

```text
observer receives exactly the event data
less coupling to subject API
easy to make immutable event objects
```

Pull:

```java
observer.update(subject);
```

Advantages:

```text
observer can retrieve whatever it needs
smaller notification signature
```

But Pull can couple observers more strongly to the subject.

In application code, immutable event objects are often a clean choice.

---

# 17. Real-world example — weather station

Suppose:

```java
interface WeatherObserver {

    void update(
        WeatherData data
    );
}
```

Event:

```java
record WeatherData(
    double temperature,
    double humidity,
    double pressure
) {}
```

Publisher:

```java
class WeatherStation {

    private final List<WeatherObserver>
            observers =
            new ArrayList<>();

    public void subscribe(
            WeatherObserver observer) {

        observers.add(observer);
    }

    public void measurementChanged(
            WeatherData data) {

        for (WeatherObserver observer
                : observers) {

            observer.update(data);
        }
    }
}
```

Observers:

```text
PhoneDisplay
ForecastDisplay
StatisticsDisplay
WarningSystem
```

This is a classic Observer use case.

---

# 18. UI event listeners

Observer appears constantly in UI programming.

Conceptually:

```java
button.addClickListener(
    listener
);
```

Then later:

```text
button clicked
      |
      v
notify listener
```

For example:

```java
button.addActionListener(
    event -> {
        System.out.println(
            "Button clicked"
        );
    }
);
```

The button is the publisher.

The callback is the observer.

---

# 19. Lambdas make Observer lightweight

Suppose:

```java
@FunctionalInterface
interface EventListener<T> {

    void onEvent(T event);
}
```

Then:

```java
publisher.subscribe(
    event ->
        System.out.println(
            event
        )
);
```

No dedicated observer class is required for simple behavior.

This is common in modern Java.

---

# 20. Generic event publisher

We can generalize:

```java
class EventPublisher<T> {

    private final List<EventListener<T>>
            listeners =
            new ArrayList<>();

    public void subscribe(
            EventListener<T> listener) {

        listeners.add(listener);
    }

    public void unsubscribe(
            EventListener<T> listener) {

        listeners.remove(listener);
    }

    public void publish(T event) {

        for (EventListener<T> listener
                : listeners) {

            listener.onEvent(event);
        }
    }
}
```

Usage:

```java
EventPublisher<OrderPlaced>
        publisher =
        new EventPublisher<>();
```

Subscribe:

```java
publisher.subscribe(
    event -> sendEmail(event)
);

publisher.subscribe(
    event -> updateAnalytics(event)
);
```

Publish:

```java
publisher.publish(
    new OrderPlaced(...)
);
```

This is Observer generalized into an event mechanism.

---

# 21. Domain events

Observer ideas appear frequently in domain-driven applications.

Suppose an order is placed.

Instead of:

```java
class OrderService {

    void placeOrder() {

        saveOrder();

        email.send();

        loyalty.addPoints();

        analytics.record();

        inventory.update();
    }
}
```

we may publish:

```java
OrderPlaced
```

Then interested handlers react:

```text
SendConfirmationEmail
AddLoyaltyPoints
RecordAnalytics
UpdateInventoryProjection
```

Conceptually:

```text
OrderService
     |
     | publishes
     v
OrderPlaced
     |
     +--> Email Handler
     +--> Loyalty Handler
     +--> Analytics Handler
```

Observer is the core idea behind this style.

---

# 22. But be careful with important business steps

Suppose an order must not succeed unless payment and inventory reservation succeed.

Those are probably not optional observers.

You may want explicit orchestration:

```java
reserveInventory();
chargePayment();
saveOrder();
```

Then publish events for secondary reactions:

```text
email
analytics
notifications
```

A useful distinction:

> Critical workflow dependencies should usually be explicit.

Observer is especially useful for decoupled reactions.

---

# 23. Observer ordering

Suppose:

```text
Observer A
Observer B
Observer C
```

Does the order matter?

Maybe.

For example:

```text
A updates database
B reads database
```

If `B` assumes `A` ran first, you've created hidden coupling.

That's dangerous.

A healthier Observer design often tries to make observers independent.

If strict ordering matters, a workflow/pipeline may be clearer.

---

# 24. Synchronous Observer

Our implementation:

```java
for (Observer observer : observers) {
    observer.update(event);
}
```

is synchronous.

That means:

```text
publisher calls observer A
waits

publisher calls observer B
waits

publisher calls observer C
waits
```

If one observer takes 10 seconds, publishing also takes 10 seconds.

---

# 25. Failure problem

Suppose:

```java
observerA.update();
observerB.update();
observerC.update();
```

and `observerB` throws.

Then maybe `observerC` never gets notified.

For example:

```java
for (StockObserver observer
        : observers) {

    observer.update(price);
}
```

One bad observer can disrupt the rest.

You need to decide your failure policy.

---

# 26. Isolate observer failures

One approach:

```java
for (StockObserver observer
        : observers) {

    try {

        observer.update(price);

    } catch (RuntimeException e) {

        logError(observer, e);
    }
}
```

Now one observer doesn't necessarily stop others.

But whether that's correct depends on domain semantics.

This is an important design choice.

---

# 27. Asynchronous Observer

Another approach is asynchronous notification.

Conceptually:

```java
executor.submit(
    () -> observer.update(event)
);
```

Then:

```text
publisher
  |
  +--> observer A task
  +--> observer B task
  +--> observer C task
```

The publisher doesn't necessarily wait for each observer.

Advantages:

```text
lower publisher latency
observers run independently
slow consumers don't block publisher directly
```

But complexity rises.

---

# 28. Async introduces new problems

Asynchronous observers introduce:

```text
race conditions
event ordering
retries
duplicate processing
partial failures
thread safety
shutdown handling
backpressure
```

So don't assume asynchronous automatically means better.

For a simple in-memory UI listener system, synchronous Observer may be perfect.

---

# 29. Observer vs message broker

Observer is typically an in-process object pattern.

Example:

```text
Java object
  ↓
Java listener objects
```

A message broker such as a queue or pub/sub system extends the same conceptual idea across processes.

Conceptually:

```text
Publisher Service
      |
      v
Message Broker
      |
   -----------
   |    |    |
   v    v    v
 A      B    C
```

Now subscribers may live on different machines.

This introduces durability, networking, retries, and delivery semantics.

---

# 30. Observer vs Publish/Subscribe

These terms overlap, but there is a useful conceptual distinction.

Classic Observer often has direct knowledge of observer objects:

```java
subject.subscribe(observer);
```

Publisher and observers live in the same process.

Pub/Sub often introduces an intermediary:

```text
Publisher
   |
   v
Event Bus / Broker
   |
   v
Subscribers
```

Publisher may not know subscribers at all.

So:

```text
Observer
→ usually direct in-process subscriptions

Pub/Sub
→ often mediated and potentially distributed
```

---

# 31. Event Bus

An in-memory event bus is a more decoupled Observer mechanism.

Instead of:

```java
stock.subscribe(observer);
```

you may have:

```java
eventBus.subscribe(
    StockPriceChanged.class,
    handler
);
```

and:

```java
eventBus.publish(
    new StockPriceChanged(...)
);
```

Then publishers and subscribers are decoupled from each other's concrete types.

This is useful, but can also make program flow harder to trace.

---

# 32. Hidden flow problem

With direct code:

```java
paymentService.charge();
emailService.send();
```

the execution flow is obvious.

With events:

```java
eventBus.publish(
    new OrderPlaced(...)
);
```

you may need to search the codebase to discover:

```text
Who subscribes to OrderPlaced?
```

Too much event-driven design can make systems difficult to understand.

Observer reduces coupling, but also reduces explicitness.

That's the tradeoff.

---

# 33. Memory leak problem

This is an important practical issue.

Suppose:

```java
publisher.subscribe(observer);
```

The publisher stores:

```java
List<Observer>
```

That means it holds references to observer objects.

Even if the rest of the application no longer needs an observer, the publisher may keep it alive.

So garbage collection can't reclaim it.

This can become a memory leak.

---

# 34. Unsubscribe matters

That's why we usually provide:

```java
unsubscribe(observer);
```

For example:

```java
stock.unsubscribe(
    dashboard
);
```

when the dashboard is closed.

Lifecycle management is important in long-running applications.

---

# 35. Subscription object

A cleaner design can return a subscription handle.

For example:

```java
interface Subscription {

    void cancel();
}
```

Then:

```java
Subscription subscription =
        publisher.subscribe(
            listener
        );
```

Later:

```java
subscription.cancel();
```

This makes ownership clearer.

---

# 36. Example implementation

```java
class EventPublisher<T> {

    private final List<EventListener<T>>
            listeners =
            new ArrayList<>();

    public Subscription subscribe(
            EventListener<T> listener) {

        listeners.add(listener);

        return () ->
            listeners.remove(listener);
    }
}
```

If `Subscription` is:

```java
@FunctionalInterface
interface Subscription {

    void cancel();
}
```

this becomes convenient.

---

# 37. Mutation while notifying

Here's a subtle bug.

Suppose:

```java
for (Observer observer : observers) {
    observer.update(event);
}
```

and an observer unsubscribes itself during `update()`.

That modifies the collection while iterating.

You may get:

```text
ConcurrentModificationException
```

One simple approach is to iterate over a snapshot:

```java
for (Observer observer
        : List.copyOf(observers)) {

    observer.update(event);
}
```

Now subscription changes don't modify the collection currently being traversed.

---

# 38. Thread safety

If one thread calls:

```java
subscribe()
```

while another calls:

```java
notifyObservers()
```

a normal `ArrayList` may not be safe.

Depending on the system, options include:

```text
synchronization
CopyOnWriteArrayList
Concurrent collections
single-threaded event loop
```

For example:

```java
private final List<Observer>
        observers =
        new CopyOnWriteArrayList<>();
```

can be useful when reads/notifications are common and subscription changes are relatively rare.

But choose based on actual concurrency needs.

---

# 39. Duplicate subscriptions

What happens if:

```java
stock.subscribe(observer);
stock.subscribe(observer);
```

?

Should the observer receive the event twice?

Maybe yes.

Maybe no.

If duplicates aren't meaningful, you might store:

```java
Set<Observer>
```

instead of:

```java
List<Observer>
```

These small contract choices matter.

---

# 40. Weak references

Some frameworks use weak references for listeners.

Conceptually:

```text
Publisher
   |
   ---> WeakReference<Observer>
```

Then the publisher doesn't necessarily keep the observer alive by itself.

This can help prevent memory leaks.

But weak references also introduce complexity and shouldn't be used automatically.

Explicit subscription lifecycle is often clearer.

---

# 41. Observer and event types

A simple observer interface:

```java
void update(double price);
```

works for one event type.

But a richer publisher may emit several events:

```text
PriceChanged
TradingHalted
DividendDeclared
MarketClosed
```

You can either create specific observer interfaces or use generic event objects.

Specific interfaces:

```java
interface PriceChangedListener {

    void onPriceChanged(
        PriceChanged event
    );
}
```

This tends to give stronger typing.

---

# 42. Avoid giant observer interfaces

Bad:

```java
interface StockObserver {

    void onPriceChanged();

    void onDividend();

    void onTradingHalted();

    void onCompanyRenamed();

    void onMarketClosed();
}
```

Some observers may care about only one event.

Then they implement lots of empty methods.

That's an ISP problem.

Prefer focused event-specific interfaces or generic event subscriptions.

---

# 43. Observer and ISP

Instead of:

```java
interface StoreObserver {

    void onOrderPlaced();
    void onOrderCancelled();
    void onInventoryChanged();
    void onUserRegistered();
}
```

you might have:

```java
interface OrderPlacedListener {
    void onOrderPlaced(
        OrderPlaced event
    );
}
```

and:

```java
interface InventoryChangedListener {
    void onInventoryChanged(
        InventoryChanged event
    );
}
```

Observers depend only on events they actually care about.

That's ISP.

---

# 44. Observer and Strategy

Strategy:

```text
Context
  ↓
one selected behavior
```

Observer:

```text
Publisher
  ↓
many interested listeners
```

Strategy asks:

> Which algorithm should perform this work?

Observer asks:

> Who needs to know that this happened?

That's a very useful distinction.

---

# 45. Observer vs Command

Observer is about notification.

Command is about representing an action/request as an object.

Observer:

```text
Order placed
→ notify listeners
```

Command:

```text
PlaceOrderCommand
→ execute()
```

Commands may themselves trigger events afterward.

The patterns often work together.

---

# 46. Observer vs Mediator

Observer lets multiple listeners react to a publisher.

Mediator centralizes communication among peer objects.

Observer:

```text
Subject
  |
  +--> Observer A
  +--> Observer B
```

Mediator:

```text
Component A
   \
    Mediator
   /
Component B
```

Mediator controls interaction flow between components.

We'll study it later.

---

# 47. Observer vs Chain of Responsibility

Observer sends a notification to:

```text
many subscribers
```

Chain of Responsibility passes a request through:

```text
a sequence of handlers
```

Observer:

```text
notify everyone interested
```

Chain:

```text
give handlers a chance to process
```

Different intent.

---

# 48. Observer and Java property changes

A common real-world style is property-change notification.

For example:

```text
name changed
price changed
status changed
```

Observer receives:

```text
property name
old value
new value
```

Conceptually:

```java
record PropertyChange<T>(
    String property,
    T oldValue,
    T newValue
) {}
```

Then UI or model components react to those changes.

This pattern appears in many UI frameworks and data-binding systems.

---

# 49. Observer and reactive programming

Reactive systems expand Observer-like concepts.

Instead of a single:

```java
update(event)
```

you work with streams:

```text
event 1
event 2
event 3
event 4
...
```

Subscribers may apply:

```text
filter
map
combine
buffer
retry
```

So reactive streams are much more sophisticated, but Observer is one of the conceptual foundations.

---

# 50. A complete order-event example

Event:

```java
record OrderPlaced(
    long orderId,
    String customerEmail
) {}
```

Listener:

```java
@FunctionalInterface
interface OrderPlacedListener {

    void onOrderPlaced(
        OrderPlaced event
    );
}
```

Publisher:

```java
class OrderEventPublisher {

    private final List<OrderPlacedListener>
            listeners =
            new ArrayList<>();

    public void subscribe(
            OrderPlacedListener listener) {

        listeners.add(listener);
    }

    public void publish(
            OrderPlaced event) {

        for (OrderPlacedListener listener
                : List.copyOf(listeners)) {

            listener.onOrderPlaced(
                event
            );
        }
    }
}
```

Observers:

```java
class ConfirmationEmailListener
        implements OrderPlacedListener {

    @Override
    public void onOrderPlaced(
            OrderPlaced event) {

        System.out.println(
            "Sending email to "
            + event.customerEmail()
        );
    }
}
```

```java
class AnalyticsListener
        implements OrderPlacedListener {

    @Override
    public void onOrderPlaced(
            OrderPlaced event) {

        System.out.println(
            "Recording order "
            + event.orderId()
        );
    }
}
```

Usage:

```java
OrderEventPublisher publisher =
        new OrderEventPublisher();

publisher.subscribe(
    new ConfirmationEmailListener()
);

publisher.subscribe(
    new AnalyticsListener()
);
```

Then:

```java
publisher.publish(
    new OrderPlaced(
        123,
        "alice@example.com"
    )
);
```

Both observers react independently.

---

# 51. Important design question: what exactly is the event?

Bad event:

```java
record SomethingChanged(
    Object data
) {}
```

This says almost nothing.

Better:

```java
record OrderPlaced(
    long orderId,
    String customerEmail
) {}
```

Good events describe a meaningful fact.

Examples:

```text
OrderPlaced
PaymentFailed
ShipmentDispatched
UserRegistered
StockPriceChanged
```

This improves readability dramatically.

---

# 52. Past-tense event names

A useful naming convention for events is past tense:

```text
OrderPlaced
PaymentCompleted
InventoryReserved
UserRegistered
```

Why?

Because an event usually means:

> Something already happened.

Compare that with a command:

```text
PlaceOrder
CompletePayment
ReserveInventory
RegisterUser
```

That's a nice conceptual distinction.

---

# 53. Event vs command

Command:

> Please do this.

```text
PlaceOrder
```

Event:

> This happened.

```text
OrderPlaced
```

Observer typically consumes events.

Command Pattern, which we'll learn next, typically represents requests.

This distinction becomes very important in event-driven architectures.

---

# 54. Don't put mutable domain objects blindly into events

Suppose:

```java
record OrderPlaced(
    Order order
) {}
```

and `Order` remains mutable.

An observer may receive an object whose state changes after publication.

That can cause confusing behavior.

Immutable event data is usually safer.

For example:

```java
record OrderPlaced(
    long orderId,
    String email,
    BigDecimal total
) {}
```

captures a stable snapshot.

---

# 55. Notification timing matters

Suppose:

```java
saveOrder();
publish(OrderPlaced);
commitTransaction();
```

What happens if the database transaction later rolls back?

Observers may have already sent an email for an order that doesn't exist.

This becomes important in production systems.

You may need to publish:

```text
after successful commit
```

or use durable transactional messaging patterns.

Observer seems simple locally, but event timing can become critical in real architectures.

---

# 56. At-most-once vs at-least-once

In simple in-memory Observer:

```text
one publish
→ one callback per subscription
```

is straightforward.

In distributed pub/sub systems, delivery may instead be:

```text
at-most-once
at-least-once
```

and sometimes duplicates occur.

Then observers need to become idempotent.

This is beyond basic GoF Observer, but it helps you see how the same idea grows into system design.

---

# 57. Idempotent observer

Suppose `OrderPlaced` may arrive twice.

Bad observer:

```java
void onOrderPlaced(
        OrderPlaced event) {

    addLoyaltyPoints(
        event.orderId()
    );
}
```

Duplicate event:

```text
points added twice
```

An idempotent handler might record:

```text
event/order already processed
```

before applying the effect again.

This matters heavily in distributed systems.

---

# 58. Common mistake: observer doing too much

Bad:

```java
class OrderPlacedListener {

    void onOrderPlaced(...) {

        sendEmail();
        reserveInventory();
        processPayment();
        calculateTax();
        shipOrder();
        generateReport();
    }
}
```

Now one observer is becoming a giant workflow.

Keep listeners focused.

For example:

```text
EmailListener
AnalyticsListener
LoyaltyListener
```

Each reacts to one event for one responsibility.

---

# 59. Common mistake: event spaghetti

If everything publishes events, which publish more events, which trigger dozens of observers, program flow can become:

```text
A
 ↓
event 1
 ↓
B
 ↓
event 2
 ↓
C
 ↓
event 3
 ↓
D
```

and nobody knows what's happening.

Observer should improve decoupling, not destroy comprehensibility.

Use explicit orchestration where sequencing and dependencies matter.

---

# 60. Common mistake: notifying when nothing changed

Suppose:

```java
stock.setPrice(100);
stock.setPrice(100);
```

Should observers be notified twice?

Maybe not.

You might write:

```java
public void setPrice(
        double newPrice) {

    if (Double.compare(
            price,
            newPrice) == 0) {

        return;
    }

    double oldPrice = price;

    price = newPrice;

    notifyObservers(
        new StockPriceChanged(
            symbol,
            oldPrice,
            newPrice
        )
    );
}
```

Only meaningful changes emit events.

---

# 61. Common mistake: exposing mutable observer list

Bad:

```java
public List<Observer>
        getObservers() {

    return observers;
}
```

Now external code can:

```java
getObservers().clear();
```

and break the publisher.

Keep subscription management encapsulated.

---

# 62. Common mistake: observer depends on publisher internals

If every observer does:

```java
subject.getInternalCache();
subject.getDatabaseConnection();
subject.getPrivateWorkflowState();
```

you've lost much of the loose coupling.

Prefer clean event data or stable public abstractions.

---

# 63. Recognition clues

Think Observer when requirements say:

```text
"When this changes, several things
must be notified."

"Listeners can subscribe and unsubscribe."

"We don't know all consumers in advance."

"New reactions should be added without
changing the publisher."

"One event may trigger many independent
responses."

"We need UI/event callbacks."
```

The strongest recognition question is:

> **When something happens, do multiple independent objects need to react without the publisher knowing their concrete types?**

If yes, Observer is a strong candidate.

---

# 64. Interview answer

If asked:

> What is the Observer Pattern?

A strong answer is:

> Observer is a behavioral design pattern that defines a one-to-many dependency between a subject and its observers. When the subject changes or publishes an event, all subscribed observers are notified through a common interface, allowing publishers and subscribers to remain loosely coupled.

Then give an example:

> A `Stock` object can maintain a list of `StockObserver`s and notify mobile apps, dashboards, and alert services whenever its price changes.

---

# 65. Push vs pull interview answer

If asked:

> What are push and pull models in Observer?

You can say:

> In the push model, the subject sends event data directly to observers. In the pull model, the subject notifies observers and they query the subject for the state they need. Push often reduces coupling when immutable event objects are used, while pull can be convenient when observers require different subsets of subject state.

---

# 66. Advantages

Observer gives us:

```text
loose coupling
runtime subscriptions
easy extensibility
one-to-many communication
event-driven architecture
separation of reactions
```

But it also introduces:

```text
hidden control flow
subscription lifecycle problems
possible memory leaks
ordering concerns
failure handling
thread-safety concerns
```

Like every pattern, it has tradeoffs.

---

# 67. Mental model

Remember:

```text
Publisher
   |
   | event
   v
Observers
```

More specifically:

```text
Subject
  |
  +--> Observer A
  +--> Observer B
  +--> Observer C
```

The Subject says:

> Something happened.

Observers say:

> If I care, I'll react.

That's the essence of Observer.

---

# Behavioral patterns so far

We've covered:

```text
Strategy
→ Choose an interchangeable algorithm.

Observer
→ Notify multiple interested objects
  when something happens.
```

The simplest distinction:

```text
Strategy
= one selected behavior

Observer
= many notified listeners
```

# Next: Lesson 21 — Command Pattern

Command takes us from:

> "Something happened."

to:

> "Please perform this action."

Imagine a text editor:

```text
Copy
Paste
Delete
Save
```

Instead of buttons directly calling business logic:

```java
saveButton.onClick(
    editor.save()
);
```

we represent actions as objects:

```java
interface Command {

    void execute();
}
```

Then:

```text
SaveCommand
CopyCommand
DeleteCommand
```

can be:

```text
executed
queued
logged
scheduled
stored in history
undone
retried
```

That's the **Command Pattern**.

Lesson 21 will cover invoker/receiver roles, undo/redo, command history, macros, queues, callbacks, lambdas as commands, and the very important distinction between **Command vs Strategy vs Observer**.
