# Lesson 24 — Chain of Responsibility Pattern

The **Chain of Responsibility** pattern is used when a request may need to pass through **multiple handlers**, and you don't want the sender tightly coupled to the exact processing sequence.

The core idea is:

> Pass a request through a chain of handlers. Each handler can process it, stop the chain, or pass it onward.

This pattern appears constantly in real systems:

```text
HTTP middleware
authentication filters
authorization
validation
logging
rate limiting
fraud checks
approval workflows
support escalation
event pipelines
```

---

# 1. Start with the problem

Imagine an incoming API request.

Before reaching the business logic, we need to:

```text
authenticate user
authorize user
check rate limit
validate request
log request
execute business logic
```

A naive controller might look like:

```java
class OrderController {

    public void createOrder(
            Request request) {

        authenticate(request);

        authorize(request);

        checkRateLimit(request);

        validate(request);

        log(request);

        orderService.createOrder(
            request
        );
    }
}
```

It works.

But now every endpoint starts repeating similar orchestration.

---

# 2. The problem grows

Suppose later we add:

```text
IP blacklist check
fraud detection
maintenance-mode check
request tracing
API version validation
```

Now the controller becomes:

```java
public void createOrder(
        Request request) {

    checkMaintenanceMode(request);

    checkIpBlacklist(request);

    authenticate(request);

    authorize(request);

    rateLimit(request);

    validateApiVersion(request);

    validate(request);

    fraudCheck(request);

    trace(request);

    log(request);

    orderService.createOrder(
        request
    );
}
```

The caller knows too much about the processing pipeline.

It also becomes difficult to reuse, rearrange, or selectively configure the steps.

---

# 3. Chain of Responsibility idea

Instead of one class explicitly calling every step:

```text
Caller
  |
  v
authenticate()
authorize()
rateLimit()
validate()
...
```

we connect handlers:

```text
Request
   |
   v
AuthenticationHandler
   |
   v
AuthorizationHandler
   |
   v
RateLimitHandler
   |
   v
ValidationHandler
   |
   v
BusinessHandler
```

Each handler knows only:

> What should I do with this request?

and possibly:

> Who is next?

---

# 4. Basic Handler abstraction

Let's start with:

```java
abstract class Handler {

    private Handler next;

    public Handler setNext(
            Handler next) {

        this.next = next;

        return next;
    }

    protected void next(
            Request request) {

        if (next != null) {
            next.handle(request);
        }
    }

    public abstract void handle(
            Request request
    );
}
```

Each handler can process the request and then decide whether to continue.

---

# 5. Authentication handler

```java
class AuthenticationHandler
        extends Handler {

    @Override
    public void handle(
            Request request) {

        if (!request.isAuthenticated()) {

            throw new SecurityException(
                "Authentication required"
            );
        }

        System.out.println(
            "Authentication passed"
        );

        next(request);
    }
}
```

This handler does exactly one thing.

---

# 6. Authorization handler

```java
class AuthorizationHandler
        extends Handler {

    @Override
    public void handle(
            Request request) {

        if (!request.hasPermission()) {

            throw new SecurityException(
                "Not authorized"
            );
        }

        System.out.println(
            "Authorization passed"
        );

        next(request);
    }
}
```

---

# 7. Validation handler

```java
class ValidationHandler
        extends Handler {

    @Override
    public void handle(
            Request request) {

        if (!request.isValid()) {

            throw new IllegalArgumentException(
                "Invalid request"
            );
        }

        System.out.println(
            "Validation passed"
        );

        next(request);
    }
}
```

---

# 8. Final business handler

```java
class OrderHandler
        extends Handler {

    private final OrderService
            orderService;

    public OrderHandler(
            OrderService orderService) {

        this.orderService =
                orderService;
    }

    @Override
    public void handle(
            Request request) {

        orderService.createOrder(
            request
        );
    }
}
```

This can be the final element in the chain.

---

# 9. Build the chain

```java
Handler authentication =
        new AuthenticationHandler();

Handler authorization =
        new AuthorizationHandler();

Handler validation =
        new ValidationHandler();

Handler order =
        new OrderHandler(
            orderService
        );
```

Connect them:

```java
authentication
    .setNext(authorization)
    .setNext(validation)
    .setNext(order);
```

Then:

```java
authentication.handle(
    request
);
```

The request flows through the chain.

---

# 10. Visualizing the flow

```text
Request
  |
  v
Authentication
  |
  | success
  v
Authorization
  |
  | success
  v
Validation
  |
  | success
  v
Order Handler
```

If authentication fails:

```text
Request
  |
  v
Authentication
  |
  X
STOP
```

Later handlers never execute.

This is called:

> **short-circuiting**

---

# 11. Two major styles of Chain of Responsibility

There are two common interpretations.

In one style, **one handler handles the request and stops**.

Example:

```text
Support request
   ↓
Level 1 Support
   ↓ not handled
Level 2 Support
   ↓ not handled
Manager
```

In another style, **many handlers participate**, like middleware:

```text
Request
   ↓
Logging
   ↓
Authentication
   ↓
Rate Limit
   ↓
Validation
   ↓
Controller
```

Both are Chain of Responsibility.

The key concept is:

> The sender doesn't need to know exactly which handler will ultimately process the request.

---

# 12. Classic example — support escalation

Suppose a support ticket has severity:

```text
LOW
MEDIUM
HIGH
CRITICAL
```

Different support levels handle different severities.

Define:

```java
enum Severity {
    LOW,
    MEDIUM,
    HIGH,
    CRITICAL
}
```

Ticket:

```java
record SupportTicket(
    Severity severity,
    String message
) {}
```

---

# 13. Support handler

```java
abstract class SupportHandler {

    private SupportHandler next;

    public SupportHandler setNext(
            SupportHandler next) {

        this.next = next;

        return next;
    }

    public void handle(
            SupportTicket ticket) {

        if (canHandle(ticket)) {

            process(ticket);

        } else if (next != null) {

            next.handle(ticket);

        } else {

            throw new IllegalStateException(
                "No handler available"
            );
        }
    }

    protected abstract boolean
        canHandle(
            SupportTicket ticket
        );

    protected abstract void
        process(
            SupportTicket ticket
        );
}
```

---

# 14. Level 1 support

```java
class LevelOneSupport
        extends SupportHandler {

    @Override
    protected boolean canHandle(
            SupportTicket ticket) {

        return ticket.severity()
                == Severity.LOW;
    }

    @Override
    protected void process(
            SupportTicket ticket) {

        System.out.println(
            "Level 1 handled ticket"
        );
    }
}
```

---

# 15. Level 2 support

```java
class LevelTwoSupport
        extends SupportHandler {

    @Override
    protected boolean canHandle(
            SupportTicket ticket) {

        return ticket.severity()
                == Severity.MEDIUM;
    }

    @Override
    protected void process(
            SupportTicket ticket) {

        System.out.println(
            "Level 2 handled ticket"
        );
    }
}
```

---

# 16. Manager support

```java
class ManagerSupport
        extends SupportHandler {

    @Override
    protected boolean canHandle(
            SupportTicket ticket) {

        return ticket.severity()
                == Severity.HIGH
            || ticket.severity()
                == Severity.CRITICAL;
    }

    @Override
    protected void process(
            SupportTicket ticket) {

        System.out.println(
            "Manager handled ticket"
        );
    }
}
```

Usage:

```java
SupportHandler level1 =
        new LevelOneSupport();

level1
    .setNext(
        new LevelTwoSupport()
    )
    .setNext(
        new ManagerSupport()
    );
```

Then:

```java
level1.handle(
    new SupportTicket(
        Severity.HIGH,
        "Production outage"
    )
);
```

The ticket travels until someone handles it.

---

# 17. This is different from simple delegation

Delegation:

```text
A always delegates to B
```

Chain of Responsibility:

```text
A may handle or pass
B may handle or pass
C may handle or pass
```

The destination isn't necessarily predetermined by the sender.

That's the important difference.

---

# 18. Core participants

The classic pattern has a **Handler** abstraction, **Concrete Handlers**, and a **Client**.

The Handler defines:

```java
handle(request)
```

and usually stores or knows the next handler.

Concrete handlers decide:

```text
Can I process this?

Yes
→ handle

No
→ pass to next
```

The Client usually builds the chain and sends the request to its first handler.

---

# 19. Why this reduces coupling

Without Chain:

```java
requestProcessor.authenticate();
requestProcessor.authorize();
requestProcessor.validate();
requestProcessor.rateLimit();
```

The caller knows every processing step.

With Chain:

```java
pipeline.handle(request);
```

The caller only knows the entry point.

That's a much weaker dependency.

---

# 20. Dynamic chain configuration

One major advantage is that chains can be assembled dynamically.

For example:

```java
Handler first =
        new LoggingHandler();

if (securityEnabled) {

    first.setNext(
        new AuthenticationHandler()
    );
}
```

Different environments can have different pipelines.

Conceptually:

```text
Production:
Logging
→ Authentication
→ RateLimit
→ Validation
→ Controller

Internal testing:
Logging
→ Validation
→ Controller
```

No need to rewrite each handler.

---

# 21. Middleware

This is one of the most important real-world uses.

Many web frameworks use middleware/filter-style processing:

```text
HTTP Request
     |
     v
Logging
     |
     v
CORS
     |
     v
Authentication
     |
     v
Rate Limiting
     |
     v
Routing
     |
     v
Controller
```

Each layer processes the request and may:

```text
continue
reject
modify request
modify response
```

That is strongly Chain-of-Responsibility-like.

---

# 22. Filters

Servlet-style filters are a classic example conceptually.

Think:

```java
interface Filter {

    void doFilter(
        Request request,
        FilterChain chain
    );
}
```

A filter may:

```java
class AuthenticationFilter
        implements Filter {

    @Override
    public void doFilter(
            Request request,
            FilterChain chain) {

        authenticate(request);

        chain.doFilter(request);
    }
}
```

The current filter calls the rest of the chain.

---

# 23. Before and after behavior

Here's something interesting.

A middleware handler can do work:

```text
before next handler
```

and:

```text
after next handler returns
```

For example:

```java
class LoggingFilter {

    void handle(
            Request request,
            Handler next) {

        System.out.println(
            "Request started"
        );

        next.handle(request);

        System.out.println(
            "Request completed"
        );
    }
}
```

Conceptually:

```text
Logging BEFORE
   ↓
Authentication BEFORE
   ↓
Controller
   ↑
Authentication AFTER
   ↑
Logging AFTER
```

This creates a nested processing structure.

---

# 24. Request and response chain

Let's model this more realistically.

```java
interface RequestHandler {

    Response handle(
        Request request
    );
}
```

Then:

```java
class LoggingHandler
        implements RequestHandler {

    private final RequestHandler next;

    LoggingHandler(
            RequestHandler next) {

        this.next = next;
    }

    @Override
    public Response handle(
            Request request) {

        System.out.println(
            "Incoming request"
        );

        Response response =
                next.handle(request);

        System.out.println(
            "Response: "
            + response.status()
        );

        return response;
    }
}
```

Now handlers can participate on both sides of the call.

---

# 25. Chain vs Decorator

At this point, you might notice something.

This:

```java
class LoggingHandler
        implements RequestHandler {

    private final RequestHandler next;
}
```

looks almost identical to Decorator.

Correct.

The structure can be very similar.

The difference is primarily **intent**.

Decorator asks:

> How can I add behavior to an object?

Chain of Responsibility asks:

> How should this request flow through a sequence of handlers?

---

# 26. Decorator vs Chain example

Decorator:

```text
Coffee
  ↓
MilkDecorator
  ↓
SugarDecorator
```

Each wrapper adds behavior to the same conceptual object.

Chain:

```text
Request
  ↓
Authentication
  ↓
Authorization
  ↓
Validation
```

Each handler participates in processing a request.

Memory shortcut:

```text
Decorator
= wrap an object

Chain
= pass a request
```

---

# 27. Another important distinction

In Decorator, every layer usually delegates.

For example:

```java
return wrapped.execute();
```

In Chain of Responsibility, a handler may decide:

```java
if (invalid) {
    return rejectedResponse;
}
```

and never call the next handler.

Short-circuiting is very natural in Chain.

---

# 28. Validation chain

Validation is an excellent example.

Suppose user registration requires:

```text
email valid
password strong enough
username available
age acceptable
```

Instead of one massive validator:

```java
class UserValidator {

    boolean validate(User user) {

        if (...) {}
        if (...) {}
        if (...) {}
        if (...) {}
    }
}
```

we can build a chain.

---

# 29. Validation handler interface

```java
interface Validator {

    ValidationResult validate(
        User user
    );
}
```

Result:

```java
record ValidationResult(
    boolean valid,
    String message
) {

    static ValidationResult success() {

        return new ValidationResult(
            true,
            ""
        );
    }

    static ValidationResult failure(
            String message) {

        return new ValidationResult(
            false,
            message
        );
    }
}
```

---

# 30. Base validator

```java
abstract class BaseValidator
        implements Validator {

    private Validator next;

    public BaseValidator setNext(
            Validator next) {

        this.next = next;

        return this;
    }

    protected ValidationResult next(
            User user) {

        if (next == null) {
            return ValidationResult
                    .success();
        }

        return next.validate(user);
    }
}
```

---

# 31. Email validator

```java
class EmailValidator
        extends BaseValidator {

    @Override
    public ValidationResult validate(
            User user) {

        if (!user.email()
                .contains("@")) {

            return ValidationResult
                    .failure(
                        "Invalid email"
                    );
        }

        return next(user);
    }
}
```

---

# 32. Password validator

```java
class PasswordValidator
        extends BaseValidator {

    @Override
    public ValidationResult validate(
            User user) {

        if (user.password()
                .length() < 8) {

            return ValidationResult
                    .failure(
                        "Password too short"
                    );
        }

        return next(user);
    }
}
```

Then:

```text
User
 ↓
EmailValidator
 ↓
PasswordValidator
 ↓
UsernameValidator
```

First failure can stop the chain.

---

# 33. Fail-fast vs collect-all

Validation reveals an important design decision.

Should we stop after the first failure?

```text
email invalid
→ STOP
```

Or collect all errors?

```text
email invalid
password too short
username unavailable
```

Classic Chain often naturally supports **fail-fast**.

But you can modify the pattern to allow every handler to contribute errors.

For example:

```java
List<String> errors =
        new ArrayList<>();
```

Every validator appends its errors and continues.

That becomes more pipeline-like.

---

# 34. Approval workflow

Imagine an expense approval system.

Different amounts require different authority:

```text
Team Lead
Manager
Director
Vice President
```

An expense of $100 might stop at Team Lead.

An expense of $50,000 may travel much farther.

This is classic Chain of Responsibility.

---

# 35. Approval handler

```java
abstract class Approver {

    private Approver next;

    public Approver setNext(
            Approver next) {

        this.next = next;

        return next;
    }

    public void approve(
            Expense expense) {

        if (canApprove(expense)) {

            doApprove(expense);

        } else if (next != null) {

            next.approve(expense);

        } else {

            throw new IllegalStateException(
                "No approver available"
            );
        }
    }

    protected abstract boolean
        canApprove(
            Expense expense
        );

    protected abstract void
        doApprove(
            Expense expense
        );
}
```

Team lead:

```java
class TeamLead
        extends Approver {

    protected boolean canApprove(
            Expense expense) {

        return expense.amount()
                <= 1_000;
    }

    protected void doApprove(
            Expense expense) {

        System.out.println(
            "Approved by team lead"
        );
    }
}
```

Manager:

```java
class Manager
        extends Approver {

    protected boolean canApprove(
            Expense expense) {

        return expense.amount()
                <= 10_000;
    }

    protected void doApprove(
            Expense expense) {

        System.out.println(
            "Approved by manager"
        );
    }
}
```

Very natural chain.

---

# 36. Logging by severity

Another classic example:

```text
DEBUG
INFO
WARN
ERROR
```

Handlers may decide which levels they process.

For example:

```java
abstract class LoggerHandler {

    private LoggerHandler next;

    public void log(
            LogLevel level,
            String message) {

        if (canHandle(level)) {
            write(message);
        }

        if (next != null) {
            next.log(
                level,
                message
            );
        }
    }

    protected abstract boolean
        canHandle(
            LogLevel level
        );

    protected abstract void
        write(
            String message
        );
}
```

Notice something different here:

The handler may process the message **and still continue**.

So Chain is flexible.

It does not always mean exactly one handler.

---

# 37. Authentication pipeline

Suppose an application supports:

```text
API key
OAuth token
session cookie
```

A chain might try:

```text
ApiKeyHandler
   ↓ if not applicable
OAuthHandler
   ↓ if not applicable
SessionHandler
```

Each handler checks:

> Can I authenticate this request?

If yes, it handles it.

If no, it passes onward.

This is very different from one giant:

```java
if (apiKey != null) {
    ...
} else if (oauth != null) {
    ...
} else if (session != null) {
    ...
}
```

---

# 38. Exception handling chain

Suppose a system receives an exception.

Different handlers understand different exception types:

```text
ValidationException
AuthenticationException
PaymentException
UnknownException
```

You could pass the exception down:

```text
ValidationExceptionHandler
       ↓
AuthenticationExceptionHandler
       ↓
PaymentExceptionHandler
       ↓
FallbackHandler
```

Each handler asks:

```text
Can I translate this exception?
```

This is another natural Chain use.

---

# 39. Chain order matters

Consider:

```text
Authentication
→ RateLimit
```

versus:

```text
RateLimit
→ Authentication
```

Those may behave differently.

Or:

```text
Compression
→ Encryption
```

versus:

```text
Encryption
→ Compression
```

Order can significantly affect semantics.

This is one of Chain's biggest design concerns.

---

# 40. Hidden ordering dependency

Suppose `AuthorizationHandler` assumes:

```text
request.user != null
```

because Authentication should have run first.

If somebody reorders:

```text
Authorization
→ Authentication
```

the system breaks.

This means the chain has an ordering dependency.

That's not automatically wrong, but it should be explicit and tested.

---

# 41. Chain assembly belongs somewhere clear

Avoid assembling chains randomly throughout the application.

A good place might be:

```text
composition root
configuration class
dependency injection configuration
pipeline builder
factory
```

For example:

```java
class RequestPipelineFactory {

    RequestHandler build() {

        return new LoggingHandler(
            new AuthenticationHandler(
                new RateLimitHandler(
                    new ControllerHandler()
                )
            )
        );
    }
}
```

Now chain configuration is centralized.

---

# 42. Chain + Builder

If configuration gets complex, Builder can help.

For example:

```java
RequestPipeline pipeline =
        RequestPipeline.builder()
            .add(logging)
            .add(authentication)
            .add(rateLimit)
            .add(validation)
            .add(controller)
            .build();
```

Builder assembles the chain.

Chain handles requests.

Patterns often work together.

---

# 43. Chain + Factory

A Factory may create different chains.

For example:

```text
Public API pipeline
Internal API pipeline
Admin API pipeline
```

Public:

```text
Logging
→ Authentication
→ RateLimit
→ Validation
```

Admin:

```text
Logging
→ StrongAuthentication
→ AdminAuthorization
→ Audit
→ Validation
```

Factory decides which pipeline to construct.

---

# 44. Chain + Command

Suppose a Command passes through:

```text
ValidationHandler
→ AuthorizationHandler
→ LoggingHandler
→ CommandHandler
```

The Command represents:

> What should happen?

The Chain represents:

> What processing steps should the request go through before execution?

They work naturally together.

---

# 45. Chain + Observer

Suppose after the chain successfully handles an order command, the system publishes:

```text
OrderPlaced
```

Then Observer notifies:

```text
Email
Analytics
Loyalty
```

So:

```text
Command
→ Chain processing
→ Domain action
→ Event
→ Observers
```

Several patterns may collaborate in one workflow.

---

# 46. Chain + Decorator

You may also combine them.

Suppose individual handlers themselves are decorated with:

```text
metrics
logging
tracing
```

Then one handler can have decorators, while the request still moves through a chain.

Pattern boundaries are about intent, not rigid class shapes.

---

# 47. Chain vs Observer

Observer:

```text
Publisher
  |
  +--> Observer A
  +--> Observer B
  +--> Observer C
```

All interested observers are notified.

Chain:

```text
Request
  ↓
Handler A
  ↓
Handler B
  ↓
Handler C
```

The request moves sequentially.

A useful distinction:

```text
Observer
= broadcast

Chain
= pipeline/escalation
```

---

# 48. Chain vs Strategy

Strategy chooses one implementation:

```text
Context
   ↓
Strategy
```

Chain potentially runs or consults several handlers:

```text
Handler A
   ↓
Handler B
   ↓
Handler C
```

Strategy:

> Which algorithm should I use?

Chain:

> Which handlers should this request travel through?

---

# 49. Chain vs State

State has exactly one current state controlling behavior:

```text
Order
  ↓
PaidState
```

Chain has multiple handlers arranged sequentially:

```text
Validation
→ Authorization
→ Processing
```

State models lifecycle.

Chain models request processing.

---

# 50. Chain vs Template Method

Template Method fixes the sequence in a base class:

```java
process() {
    stepA();
    stepB();
    stepC();
}
```

Chain externalizes the sequence into connected handlers:

```text
Handler A
→ Handler B
→ Handler C
```

Template Method is more rigid.

Chain is often more configurable.

---

# 51. Chain vs pipeline

The terms are often used loosely.

A pipeline usually means:

> Several processing stages transform or process data in order.

A Chain of Responsibility often emphasizes:

> Each handler decides whether or how to continue.

In practice, middleware pipelines are commonly described as Chain of Responsibility even when every stage participates.

Don't get too hung up on terminology.

Focus on the design intent.

---

# 52. Returning a response

A robust Chain often returns something.

For example:

```java
interface Handler {

    Response handle(
        Request request
    );
}
```

Authentication:

```java
class AuthenticationHandler
        implements Handler {

    private final Handler next;

    public Response handle(
            Request request) {

        if (!authenticated(request)) {

            return Response.unauthorized();
        }

        return next.handle(request);
    }
}
```

This makes short-circuiting very natural.

---

# 53. Request transformation

Handlers can also enrich requests.

For example:

```text
AuthenticationHandler
→ attaches authenticated user

TracingHandler
→ adds trace ID

LocaleHandler
→ determines locale
```

Then later handlers consume the enriched request.

But this introduces dependencies between stages.

Use clear request/context objects.

---

# 54. Pipeline context

Instead of modifying the original request, you might create:

```java
class RequestContext {

    private Request request;
    private User user;
    private String traceId;
    private Locale locale;

    // ...
}
```

Then:

```java
handler.handle(context);
```

Each handler can add information.

For example:

```text
Authentication
→ context.user

Tracing
→ context.traceId
```

This is common in request processing systems.

---

# 55. Avoid giant shared contexts

However, don't let:

```java
RequestContext
```

turn into:

```text
100 unrelated fields
every handler mutating everything
```

That creates hidden coupling.

The shared context should contain genuinely pipeline-relevant data.

---

# 56. Mutable vs immutable request

Some chains mutate the request/context.

Others return a new value.

Functional style:

```java
Request request =
        handler.process(request);
```

Each handler returns a transformed request.

Immutable transformation can make reasoning easier, though it may create more objects.

Again, design tradeoff.

---

# 57. Exception strategy

Suppose a handler throws.

Should later handlers run?

Usually no.

But a chain may have an outer exception handler.

For example:

```text
ExceptionHandler
    ↓
LoggingHandler
    ↓
AuthenticationHandler
    ↓
Controller
```

The outer handler can catch errors from everything downstream.

This is similar to middleware stacks.

---

# 58. Before/after nesting

Imagine:

```text
A
→ B
→ C
```

Each does work before and after `next`.

Execution becomes:

```text
A before
B before
C before

C after
B after
A after
```

This is important.

The call stack unwinds in reverse order.

That makes Chain-style middleware useful for:

```text
transactions
metrics timing
resource cleanup
tracing scopes
```

---

# 59. Transaction handler example

Conceptually:

```java
public Response handle(
        Request request) {

    transaction.begin();

    try {

        Response response =
                next.handle(request);

        transaction.commit();

        return response;

    } catch (RuntimeException e) {

        transaction.rollback();

        throw e;
    }
}
```

Everything downstream executes inside the transaction.

That is powerful.

---

# 60. Metrics handler

```java
public Response handle(
        Request request) {

    long start =
            System.nanoTime();

    try {

        return next.handle(request);

    } finally {

        long duration =
            System.nanoTime()
            - start;

        metrics.record(duration);
    }
}
```

The handler doesn't care what the actual business operation is.

It wraps pipeline execution.

---

# 61. This looks like Proxy or Decorator too

Correct again.

Many patterns share structures.

For:

```java
class MetricsHandler
        implements Handler {

    private Handler next;
}
```

you could reasonably describe it as Decorator depending on context.

If you're discussing the **entire ordered request-processing pipeline**, Chain of Responsibility is the useful abstraction.

If you're discussing **adding metrics behavior around one service**, Decorator may be more accurate.

Intent wins.

---

# 62. OCP

Adding:

```java
FraudCheckHandler
```

doesn't require modifying:

```text
AuthenticationHandler
AuthorizationHandler
ValidationHandler
```

You insert a new handler into the chain.

That supports OCP.

---

# 63. SRP

Each handler can own one responsibility:

```text
AuthenticationHandler
→ authenticate

AuthorizationHandler
→ authorize

RateLimitHandler
→ rate limit

ValidationHandler
→ validate
```

This is much cleaner than a giant:

```java
RequestProcessor
```

that knows everything.

---

# 64. DIP

Handlers can depend on abstractions.

For example:

```java
class AuthenticationHandler {

    private final Authenticator
            authenticator;
}
```

instead of directly depending on a concrete authentication provider.

Chain and SOLID work nicely together.

---

# 65. Testing each handler

Handlers become easy to test individually.

For authentication:

```text
unauthenticated request
→ rejected

authenticated request
→ next handler called
```

For rate limiting:

```text
under limit
→ continue

over limit
→ stop
```

Very focused tests.

---

# 66. Testing chain order

You should also test integration of the chain.

For example:

```text
Authentication must run before Authorization.
```

And perhaps:

```text
Rate limiting must run before expensive validation.
```

Handler unit tests alone won't catch assembly mistakes.

---

# 67. Common mistake — forgetting the next handler

Imagine:

```java
public void handle(
        Request request) {

    validate(request);

    // forgot next(request)
}
```

The chain silently stops.

This is one reason some designs make continuation more explicit.

For example:

```java
return next.handle(request);
```

is harder to overlook.

---

# 68. Common mistake — unclear terminal handler

What happens when the chain reaches the end?

You should define it explicitly.

Possibilities include:

```text
return success
throw error
do nothing
execute final business operation
```

Avoid ambiguous behavior.

---

# 69. Null Object as chain terminator

Instead of checking:

```java
if (next != null)
```

everywhere, you can use a terminal handler.

```java
class TerminalHandler
        implements Handler {

    @Override
    public Response handle(
            Request request) {

        return Response.ok();
    }
}
```

Then every handler always has a `next`.

This is the Null Object idea again.

---

# 70. Common mistake — enormous handlers

Bad:

```java
class SecurityHandler {

    authenticate();
    authorize();
    rateLimit();
    validateCsrf();
    validateIp();
    verifyDevice();
    ...
}
```

You've merely moved the giant method into one chain element.

Prefer focused handlers when responsibilities are genuinely independent.

---

# 71. Common mistake — too many microscopic handlers

The opposite can happen.

You probably don't need:

```text
CheckEmailNotNullHandler
CheckEmailContainsAtHandler
CheckEmailLengthHandler
CheckEmailDomainHandler
```

for every tiny condition.

That may become harder to understand than one cohesive `EmailValidator`.

Granularity matters.

---

# 72. Common mistake — chain used where ordering is rigid business logic

Suppose placing an order *must always* do:

```text
reserve inventory
charge payment
save order
```

with complex compensation rules.

A Chain might technically work, but explicit orchestration could be clearer:

```java
reserveInventory();
chargePayment();
saveOrder();
```

Chain is strongest when steps are modular, configurable, or independently applicable.

Don't hide critical workflows just to use a pattern.

---

# 73. Common mistake — hidden business flow

If you have 25 handlers dynamically registered in unknown order, answering:

> What actually happens to a request?

can become very difficult.

Loose coupling is good.

Invisible control flow is not always good.

Maintain observability and clear configuration.

---

# 74. Common mistake — assuming every handler must stop or continue

Some developers think Chain must be:

```java
if (canHandle) {
    handle();
} else {
    next();
}
```

But middleware chains often do:

```java
doSomething();

next();

doSomethingAfter();
```

Pattern implementations vary.

Again, intent matters more than memorizing one code template.

---

# 75. Static vs dynamic chain

A chain can be configured once:

```text
A → B → C
```

and remain fixed.

Or constructed dynamically:

```text
if admin:
    Audit → AdminAuth → Validation

if public:
    RateLimit → Auth → Validation
```

Dynamic composition is one of its major strengths.

---

# 76. Chain as a collection instead of linked objects

You don't necessarily need each handler to hold `next`.

Another implementation can use:

```java
List<Handler> handlers;
```

Then:

```java
for (Handler handler : handlers) {

    HandlerResult result =
            handler.handle(request);

    if (result.shouldStop()) {
        return result;
    }
}
```

This is often simpler.

The design idea is still Chain of Responsibility.

---

# 77. Linked chain vs list pipeline

Linked design:

```text
Handler
  |
  next
```

Advantages:

```text
classic OO representation
handler controls continuation
supports before/after nesting naturally
```

List pipeline:

```text
Pipeline
→ List<Handler>
```

Advantages:

```text
easy configuration
easy reordering
simpler traversal
centralized control
```

Choose based on needs.

---

# 78. A modern Java pipeline

For example:

```java
interface RequestFilter {

    FilterResult apply(
        RequestContext context
    );
}
```

Result:

```java
enum FilterResult {
    CONTINUE,
    STOP
}
```

Pipeline:

```java
class RequestPipeline {

    private final List<RequestFilter>
            filters;

    public void process(
            RequestContext context) {

        for (RequestFilter filter
                : filters) {

            if (filter.apply(context)
                    == FilterResult.STOP) {

                return;
            }
        }
    }
}
```

This is a clean Chain-style implementation without explicit linked nodes.

---

# 79. Lambdas can be handlers

If:

```java
@FunctionalInterface
interface Handler {

    boolean handle(
        Request request
    );
}
```

then:

```java
Handler auth =
        request ->
            request.isAuthenticated();
```

and:

```java
Handler validation =
        request ->
            request.isValid();
```

For simple chains, lambdas can reduce class explosion.

---

# 80. When classes are better

Dedicated classes are better when handlers:

```text
need dependencies
contain substantial logic
need state
are reused
need independent testing
carry meaningful domain names
```

For example:

```java
class FraudDetectionHandler {

    private final FraudService
            fraudService;
}
```

deserves a class.

---

# 81. Recognition clues

Think Chain of Responsibility when requirements sound like:

```text
"Pass this request through several checks."

"Different handlers may process the request."

"A handler may reject or stop processing."

"We want to add/remove/reorder processing steps."

"We need middleware or filters."

"Different requests may use different pipelines."

"We don't want the sender to know
which handler actually processes it."
```

The strongest recognition question is:

> **Does a request need to travel through a configurable sequence of handlers, where each handler may process, reject, or pass it onward?**

If yes, Chain of Responsibility is a strong candidate.

---

# 82. Interview answer

If asked:

> What is the Chain of Responsibility Pattern?

A strong answer is:

> Chain of Responsibility is a behavioral design pattern that passes a request through a sequence of handlers. Each handler can process the request, stop the chain, or forward it to the next handler. This decouples the sender from the exact receiver and makes processing pipelines easier to extend and configure.

Then give an example:

> An HTTP request may flow through authentication, authorization, rate limiting, validation, and finally a controller.

---

# 83. Interview example

A concise example:

```text
Request
   ↓
AuthenticationHandler
   ↓
AuthorizationHandler
   ↓
RateLimitHandler
   ↓
ValidationHandler
   ↓
ControllerHandler
```

If authentication fails:

```text
AuthenticationHandler
   ↓
STOP
```

Otherwise the chain continues.

---

# 84. Chain vs Decorator interview answer

A strong answer:

> Both can use wrappers and delegation, but Decorator is intended to add responsibilities to an object while preserving its interface, whereas Chain of Responsibility is intended to pass a request through a sequence of potential handlers. A Chain handler may also stop processing instead of always delegating.

---

# 85. Chain vs Observer interview answer

> Observer broadcasts an event to multiple subscribers, whereas Chain of Responsibility passes a request sequentially through handlers, often with the ability to stop before reaching later handlers.

Memory shortcut:

```text
Observer
→ fan out

Chain
→ flow through
```

---

# 86. Chain vs Strategy interview answer

> Strategy selects one interchangeable algorithm, while Chain of Responsibility allows a request to pass through multiple handlers until processing is complete or stopped.

Memory shortcut:

```text
Strategy
= choose one

Chain
= traverse several
```

---

# 87. Mental model

Remember:

```text
Request
  |
  v
Handler
  |
  | continue?
  v
Handler
  |
  | continue?
  v
Handler
```

Every handler asks:

> Should I process this?

and then:

> Should the request continue?

That is the essence of Chain of Responsibility.

---

# Behavioral patterns so far

We've now covered:

```text
Strategy
→ interchangeable algorithms

Observer
→ notify interested listeners

Command
→ package actions as objects

State
→ lifecycle-dependent behavior

Template Method
→ fixed workflow with customizable steps

Chain of Responsibility
→ pass requests through handlers
```

A compact mental model:

```text
Strategy        = choose HOW

Observer        = notify WHO

Command         = package WHAT

State           = lifecycle behavior

Template Method = fixed workflow

Chain           = processing pipeline
```

# Next: Lesson 25 — Iterator Pattern

Iterator solves another very common problem.

Suppose you have a custom collection:

```java
class Playlist {

    private Song[] songs;
}
```

Client code should not need to know whether the playlist internally uses:

```text
array
ArrayList
LinkedList
tree
database-backed collection
```

Instead, the collection exposes a way to traverse elements:

```java
Iterator<Song> iterator =
        playlist.iterator();

while (iterator.hasNext()) {

    Song song =
            iterator.next();
}
```

Iterator separates:

> **How a collection stores elements**

from:

> **How clients traverse those elements**

Lesson 25 will cover Java's `Iterator<T>`, `Iterable<T>`, enhanced `for` loops, custom iterators, lazy traversal, fail-fast behavior, and Iterator vs Composite/Visitor.
