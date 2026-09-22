# Lesson 21 — Command Pattern

The **Command Pattern** is used when you want to represent an action or request as an object.

The core idea is:

> Turn a request into an object so it can be executed, queued, logged, scheduled, retried, stored, or undone.

Instead of directly saying:

```java
light.turnOn();
```

you create:

```java
Command command =
        new TurnOnLightCommand(light);

command.execute();
```

That extra object may look unnecessary at first.

But it becomes powerful when you need things like:

```text
undo
redo
history
queues
macros
scheduling
callbacks
retries
remote controls
transaction-like actions
```

---

# 1. Start with the problem

Imagine a remote control.

We have:

```java
class Light {

    public void turnOn() {
        System.out.println(
            "Light ON"
        );
    }

    public void turnOff() {
        System.out.println(
            "Light OFF"
        );
    }
}
```

A naive remote:

```java
class RemoteControl {

    private final Light light;

    public RemoteControl(
            Light light) {

        this.light = light;
    }

    public void pressOn() {
        light.turnOn();
    }

    public void pressOff() {
        light.turnOff();
    }
}
```

This works.

But now we add:

```text
TV
Fan
Garage Door
Stereo
Air Conditioner
```

The remote might become:

```java
class RemoteControl {

    void pressLightOn() {}
    void pressLightOff() {}

    void pressTvOn() {}
    void pressTvOff() {}

    void pressFanOn() {}
    void pressGarageOpen() {}
}
```

The remote becomes tightly coupled to every device.

---

# 2. The key design question

The remote should not care:

> What exactly happens when a button is pressed?

It should just know:

> Execute this action.

So let's abstract the action.

---

# 3. Command interface

```java
interface Command {

    void execute();
}
```

That's the central abstraction.

Each action becomes a command object.

---

# 4. Concrete command

```java
class TurnOnLightCommand
        implements Command {

    private final Light light;

    public TurnOnLightCommand(
            Light light) {

        this.light = light;
    }

    @Override
    public void execute() {

        light.turnOn();
    }
}
```

Another:

```java
class TurnOffLightCommand
        implements Command {

    private final Light light;

    public TurnOffLightCommand(
            Light light) {

        this.light = light;
    }

    @Override
    public void execute() {

        light.turnOff();
    }
}
```

Notice the command contains the object that knows how to perform the real work.

That object is called the:

> **Receiver**

Here:

```java
Light
```

is the Receiver.

---

# 5. The Invoker

Now the remote doesn't need to know about `Light`.

It only knows:

```java
Command
```

For example:

```java
class RemoteControl {

    private Command command;

    public void setCommand(
            Command command) {

        this.command = command;
    }

    public void pressButton() {

        command.execute();
    }
}
```

Usage:

```java
Light light =
        new Light();

Command turnOn =
        new TurnOnLightCommand(
            light
        );

RemoteControl remote =
        new RemoteControl();

remote.setCommand(turnOn);

remote.pressButton();
```

Output:

```text
Light ON
```

The remote doesn't know:

```text
Light
turnOn()
TurnOnLightCommand internals
```

It only knows:

```java
command.execute();
```

---

# 6. Command roles

There are usually four important roles.

### Command

Common interface:

```java
interface Command {

    void execute();
}
```

### Concrete Command

Represents a specific action:

```text
TurnOnLightCommand
TurnOffLightCommand
OpenGarageCommand
PlayMusicCommand
```

### Receiver

Knows how to do the actual work:

```text
Light
GarageDoor
Stereo
TV
```

### Invoker

Triggers the Command:

```text
RemoteControl
Button
MenuItem
Scheduler
CommandQueue
```

Conceptually:

```text
Invoker
   |
   v
Command
   |
   v
Receiver
```

---

# 7. Why not call the Receiver directly?

Without Command:

```java
remote.pressButton() {
    light.turnOn();
}
```

The invoker knows:

```text
which object
which method
which arguments
```

With Command:

```java
remote.pressButton() {
    command.execute();
}
```

The invoker becomes generic.

That's the main decoupling.

---

# 8. Multiple devices

Suppose:

```java
class Television {

    public void turnOn() {
        System.out.println(
            "TV ON"
        );
    }
}
```

Command:

```java
class TurnOnTvCommand
        implements Command {

    private final Television tv;

    public TurnOnTvCommand(
            Television tv) {

        this.tv = tv;
    }

    @Override
    public void execute() {

        tv.turnOn();
    }
}
```

Now the same remote can execute:

```java
remote.setCommand(
    new TurnOnLightCommand(light)
);
```

or:

```java
remote.setCommand(
    new TurnOnTvCommand(tv)
);
```

The remote remains unchanged.

---

# 9. Command and OCP

Suppose we add:

```text
StartCoffeeMachineCommand
OpenGarageDoorCommand
TurnOnFanCommand
```

We create new Command implementations.

We don't modify:

```java
RemoteControl
```

That's Open/Closed Principle.

---

# 10. Command and DIP

The remote depends on:

```java
Command
```

rather than:

```text
Light
TV
GarageDoor
```

That's Dependency Inversion.

---

# 11. Command and SRP

Without Command, the remote might contain device-specific logic.

With Command:

```text
RemoteControl
→ triggers commands

TurnOnLightCommand
→ represents light-on request

Light
→ knows how to operate itself
```

Responsibilities are separated.

---

# 12. Command with arguments

Commands can carry all information needed to perform the action.

Suppose we have:

```java
class BankAccount {

    private double balance;

    public void deposit(
            double amount) {

        balance += amount;
    }

    public void withdraw(
            double amount) {

        balance -= amount;
    }
}
```

Deposit command:

```java
class DepositCommand
        implements Command {

    private final BankAccount account;
    private final double amount;

    public DepositCommand(
            BankAccount account,
            double amount) {

        this.account = account;
        this.amount = amount;
    }

    @Override
    public void execute() {

        account.deposit(amount);
    }
}
```

Now the command stores:

```text
receiver
+
parameters
```

That lets the request exist independently from the caller.

---

# 13. Commands can be stored

Because a Command is an object:

```java
Command command;
```

you can put it into:

```java
List<Command>
Queue<Command>
Stack<Command>
```

This is where the pattern becomes really useful.

---

# 14. Command queue

Suppose:

```java
Queue<Command> queue =
        new ArrayDeque<>();
```

We add:

```java
queue.add(
    new DepositCommand(
        account,
        100
    )
);

queue.add(
    new DepositCommand(
        account,
        50
    )
);
```

Later:

```java
while (!queue.isEmpty()) {

    Command command =
            queue.poll();

    command.execute();
}
```

Commands can be created now and executed later.

This supports:

```text
job queues
background processing
task schedulers
batch processing
```

---

# 15. Scheduling

Because commands are objects, a scheduler can receive:

```java
Command
```

without knowing what the operation does.

Conceptually:

```java
scheduler.schedule(
    command,
    executionTime
);
```

Later:

```java
command.execute();
```

The scheduler handles timing.

The Command handles the action.

---

# 16. Command history

Suppose we want to remember everything the user does.

```java
class CommandHistory {

    private final List<Command>
            history =
            new ArrayList<>();

    public void add(
            Command command) {

        history.add(command);
    }
}
```

Then:

```java
command.execute();
history.add(command);
```

Now we have a record of performed actions.

This is useful in:

```text
text editors
graphics tools
workflow systems
audit systems
games
```

---

# 17. Undo

Command becomes especially famous because it supports **undo**.

We can extend:

```java
interface Command {

    void execute();

    void undo();
}
```

Now:

```java
class TurnOnLightCommand
        implements Command {

    private final Light light;

    public TurnOnLightCommand(
            Light light) {

        this.light = light;
    }

    @Override
    public void execute() {
        light.turnOn();
    }

    @Override
    public void undo() {
        light.turnOff();
    }
}
```

The inverse of:

```text
turn on
```

is:

```text
turn off
```

---

# 18. Remote with undo

```java
class RemoteControl {

    private Command command;
    private Command lastCommand;

    public void setCommand(
            Command command) {

        this.command = command;
    }

    public void pressButton() {

        command.execute();

        lastCommand =
                command;
    }

    public void pressUndo() {

        if (lastCommand != null) {
            lastCommand.undo();
        }
    }
}
```

Usage:

```java
remote.setCommand(
    new TurnOnLightCommand(light)
);

remote.pressButton();
```

Output:

```text
Light ON
```

Then:

```java
remote.pressUndo();
```

Output:

```text
Light OFF
```

---

# 19. Undo with previous state

Undo isn't always just the opposite method.

Suppose:

```java
class Thermostat {

    private int temperature;

    public void setTemperature(
            int temperature) {

        this.temperature =
                temperature;
    }

    public int getTemperature() {
        return temperature;
    }
}
```

Command:

```java
class SetTemperatureCommand
        implements Command {

    private final Thermostat thermostat;
    private final int newTemperature;

    private int previousTemperature;

    public SetTemperatureCommand(
            Thermostat thermostat,
            int newTemperature) {

        this.thermostat = thermostat;
        this.newTemperature =
                newTemperature;
    }

    @Override
    public void execute() {

        previousTemperature =
            thermostat.getTemperature();

        thermostat.setTemperature(
            newTemperature
        );
    }

    @Override
    public void undo() {

        thermostat.setTemperature(
            previousTemperature
        );
    }
}
```

The command remembers enough state to reverse itself.

---

# 20. Undo stack

For multiple levels of undo:

```java
Deque<Command> history =
        new ArrayDeque<>();
```

Execute:

```java
command.execute();

history.push(command);
```

Undo:

```java
Command last =
        history.pop();

last.undo();
```

Now:

```text
Action A
Action B
Action C
```

history becomes:

```text
top
 C
 B
 A
```

Undo removes:

```text
C
then B
then A
```

Classic editor behavior.

---

# 21. Redo

For redo, you typically maintain:

```text
undo stack
redo stack
```

When executing a new command:

```text
execute command
push onto undo stack
clear redo stack
```

Undo:

```text
pop undo stack
undo command
push onto redo stack
```

Redo:

```text
pop redo stack
execute again
push onto undo stack
```

This is exactly the kind of behavior Command makes manageable.

---

# 22. Text editor example

Imagine:

```java
class TextEditor {

    private String text;

    public void insert(
            String value) {

        text += value;
    }

    public void deleteLast(
            int count) {

        text =
            text.substring(
                0,
                text.length() - count
            );
    }

    public String getText() {
        return text;
    }
}
```

Insert command:

```java
class InsertTextCommand
        implements Command {

    private final TextEditor editor;
    private final String text;

    public InsertTextCommand(
            TextEditor editor,
            String text) {

        this.editor = editor;
        this.text = text;
    }

    @Override
    public void execute() {

        editor.insert(text);
    }

    @Override
    public void undo() {

        editor.deleteLast(
            text.length()
        );
    }
}
```

Now every user edit can become a command.

That's a foundation for undo/redo systems.

---

# 23. Macro Command

Suppose one button should execute multiple commands.

For example:

```text
Movie Night
```

should:

```text
turn off lights
turn on TV
turn on sound system
start streaming player
```

Create:

```java
class MacroCommand
        implements Command {

    private final List<Command>
            commands;

    public MacroCommand(
            List<Command> commands) {

        this.commands = commands;
    }

    @Override
    public void execute() {

        for (Command command
                : commands) {

            command.execute();
        }
    }
}
```

Now:

```java
Command movieNight =
        new MacroCommand(
            List.of(
                lightOff,
                tvOn,
                soundOn,
                streamingOn
            )
        );
```

Then:

```java
movieNight.execute();
```

One command represents a group of commands.

---

# 24. Undo a Macro

If commands support undo:

```java
@Override
public void undo() {

    for (int i =
            commands.size() - 1;
            i >= 0;
            i--) {

        commands.get(i)
                .undo();
    }
}
```

Notice the reverse order.

If execution is:

```text
A
B
C
```

undo should usually be:

```text
C
B
A
```

This is common in transactional operations.

---

# 25. Command and transactions

Suppose:

```text
Debit account A
Credit account B
Record transaction
```

You may represent these as commands.

If one fails, previously executed operations could potentially be compensated.

Conceptually:

```text
execute A
execute B
execute C

if C fails:
undo B
undo A
```

This doesn't automatically give you database ACID transactions, but Command can help model compensating actions.

---

# 26. Command and callbacks

A callback is often essentially a lightweight Command.

For example:

```java
button.setOnClick(
    () -> saveDocument()
);
```

The lambda represents:

> Execute this action later.

That's Command-like thinking.

You don't always need a named `Command` class.

---

# 27. Commands with lambdas

Suppose:

```java
@FunctionalInterface
interface Command {

    void execute();
}
```

Then:

```java
Command saveCommand =
        () -> document.save();
```

and:

```java
Command printCommand =
        () -> document.print();
```

Invoker:

```java
class Button {

    private final Command command;

    public Button(Command command) {
        this.command = command;
    }

    public void click() {
        command.execute();
    }
}
```

Usage:

```java
Button saveButton =
        new Button(
            () -> document.save()
        );
```

This is still Command conceptually.

---

# 28. When should I use a class instead of a lambda?

Use a lambda when the command is:

```text
small
stateless
simple
local
```

Use a class when the command:

```text
has parameters
has undo state
needs dependencies
needs logging metadata
will be queued
will be serialized
has substantial logic
has domain meaning
```

Example:

```java
TransferMoneyCommand
```

probably deserves its own class.

---

# 29. Command in job processing

Imagine:

```java
interface Job {

    void execute();
}
```

Implementations:

```text
SendEmailJob
GenerateReportJob
ResizeImageJob
SyncCustomerJob
```

Queue:

```java
Queue<Job> jobs;
```

Worker:

```java
while (true) {

    Job job =
            jobs.poll();

    job.execute();
}
```

This is extremely Command-like.

The worker doesn't know what each job actually does.

---

# 30. Command and delayed execution

Suppose:

```java
Command command =
        new SendReminderCommand(
            notificationService,
            userId
        );
```

Instead of executing now:

```java
command.execute();
```

we schedule it for tomorrow.

That's possible because the request has been packaged into an object.

This is one of the deepest benefits of Command:

> Separate creation of a request from execution of that request.

---

# 31. Command serialization

In some architectures, a command can be serialized:

```text
{
  "type": "SEND_EMAIL",
  "userId": 123
}
```

and put into a queue.

Another process reconstructs and executes it.

This resembles distributed job systems.

But be careful: GoF Command is an object-oriented pattern; distributed commands introduce many additional concerns.

---

# 32. Idempotency

Suppose:

```text
ChargeCreditCardCommand
```

gets retried accidentally.

If it runs twice:

```text
customer charged twice
```

That's bad.

For commands in distributed/retryable environments, idempotency becomes important.

For example:

```text
commandId = abc123
```

The receiver may remember that command `abc123` has already been processed.

This is beyond the basic pattern, but extremely important in production systems.

---

# 33. Command vs Strategy

This is a very important distinction.

Strategy represents:

> How should this responsibility be performed?

Command represents:

> What action should be performed?

Strategy:

```java
paymentStrategy.pay(amount);
```

Possible choices:

```text
Card
PayPal
Crypto
```

Command:

```java
command.execute();
```

Possible commands:

```text
PlaceOrder
CancelOrder
RefundPayment
SendEmail
```

A simple memory trick:

```text
Strategy
→ HOW

Command
→ WHAT
```

---

# 34. Example Strategy vs Command

Strategy:

```text
How should we calculate route?

FastestRoute
ScenicRoute
WalkingRoute
```

Command:

```text
What should we do?

StartNavigation
CancelNavigation
SaveRoute
ShareRoute
```

Different intentions.

---

# 35. Command vs Observer

Observer:

> Something happened; notify interested listeners.

Command:

> Please perform this action.

Command:

```text
PlaceOrder
```

Event:

```text
OrderPlaced
```

This is an important architecture distinction.

Command is typically imperative:

```text
Do this.
```

Observer event is descriptive:

```text
This happened.
```

---

# 36. Command vs State

Command represents an action.

State represents how behavior changes depending on an object's current lifecycle state.

For example:

```text
Command:
CancelOrderCommand

State:
Created
Paid
Shipped
Delivered
```

The `CancelOrderCommand` may behave differently depending on the order's State.

The patterns can work together.

---

# 37. Command vs Chain of Responsibility

Command packages the request.

Chain of Responsibility decides:

> Which handler should process the request?

They can work together.

For example:

```text
Command
  ↓
Validation Handler
  ↓
Authorization Handler
  ↓
Execution Handler
```

Command describes the action.

Chain controls processing flow.

---

# 38. Command vs Memento

Command is often used for undo.

Memento, which we'll study later, also supports undo.

But they do it differently.

Command:

```text
Store action + inverse action
```

Memento:

```text
Store snapshot of previous state
```

Example:

```text
Command:
undo typing by deleting inserted text

Memento:
restore entire document snapshot
```

They can also be used together.

---

# 39. Command vs Template Method

Command:

> Encapsulate an action as an object.

Template Method:

> Define the skeleton of an algorithm in a base class.

They solve completely different problems.

---

# 40. Real example — restaurant ordering

Suppose the waiter receives requests:

```text
CookBurger
CookPasta
MakeCoffee
```

The waiter shouldn't know how each dish is cooked.

Command:

```java
interface OrderCommand {

    void execute();
}
```

Receiver:

```java
class Kitchen {

    void cookBurger() {}

    void cookPasta() {}
}
```

Command:

```java
class CookBurgerCommand
        implements OrderCommand {

    private final Kitchen kitchen;

    public CookBurgerCommand(
            Kitchen kitchen) {

        this.kitchen = kitchen;
    }

    public void execute() {

        kitchen.cookBurger();
    }
}
```

Invoker:

```java
class Waiter {

    public void submit(
            OrderCommand command) {

        command.execute();
    }
}
```

This matches the original metaphor behind the pattern quite nicely.

---

# 41. Real example — GUI menu

Imagine:

```text
File
 ├── Save
 ├── Open
 ├── Print
 └── Exit
```

Instead of each menu item knowing the application internals:

```java
class MenuItem {

    private final Command command;

    public MenuItem(
            Command command) {

        this.command = command;
    }

    public void click() {

        command.execute();
    }
}
```

Now:

```java
MenuItem save =
        new MenuItem(
            new SaveDocumentCommand(
                document
            )
        );
```

and:

```java
MenuItem print =
        new MenuItem(
            new PrintDocumentCommand(
                document
            )
        );
```

One generic `MenuItem` class handles many actions.

---

# 42. Reusing Commands across UI elements

Suppose both:

```text
Save button
Ctrl+S keyboard shortcut
File → Save menu item
```

should perform the same operation.

They can share:

```java
Command saveCommand =
        new SaveDocumentCommand(
            document
        );
```

Then:

```text
Button
    \
MenuItem ---> SaveCommand
    /
Shortcut
```

This avoids duplicating action wiring.

Very common GUI architecture.

---

# 43. Commands can carry metadata

A richer Command might contain:

```text
command ID
created time
user ID
retry count
priority
correlation ID
```

For example:

```java
class GenerateReportCommand
        implements Command {

    private final UUID commandId;
    private final long userId;
    private final ReportType type;

    ...
}
```

This is useful for:

```text
audit
job processing
distributed tracing
scheduling
```

---

# 44. Command bus

In larger applications, you may see:

```java
commandBus.dispatch(command);
```

For example:

```java
commandBus.dispatch(
    new PlaceOrderCommand(...)
);
```

The command bus finds the corresponding handler.

Conceptually:

```text
PlaceOrderCommand
       |
       v
CommandBus
       |
       v
PlaceOrderHandler
```

This is an evolution of Command-style architecture.

---

# 45. Command + Handler variant

Instead of putting `execute()` directly inside the command, some systems separate:

```text
data representing request
```

from:

```text
handler executing request
```

For example:

```java
record PlaceOrderCommand(
    long customerId,
    List<Long> productIds
) {}
```

Handler:

```java
class PlaceOrderHandler {

    public void handle(
            PlaceOrderCommand command) {

        ...
    }
}
```

This is common in application architectures such as CQRS.

It's conceptually related to Command, although not identical to the classic GoF shape.

---

# 46. Why separate Command from Handler?

A command as pure data can be:

```text
serialized
validated
logged
queued
transported
```

while the handler contains dependencies and business logic.

For example:

```text
Command
→ what is requested

Handler
→ how request is executed
```

This can be useful at larger architectural scales.

---

# 47. Retryable commands

Suppose:

```java
class RetryableCommand
        implements Command {

    private final Command command;
    private final int maxAttempts;

    ...
}
```

Then:

```java
public void execute() {

    for (int attempt = 1;
            attempt <= maxAttempts;
            attempt++) {

        try {

            command.execute();

            return;

        } catch (
                RuntimeException e) {

            if (attempt == maxAttempts) {
                throw e;
            }
        }
    }
}
```

This starts overlapping with Decorator.

Again, patterns can compose.

---

# 48. Logging commands

You could wrap commands:

```java
class LoggingCommand
        implements Command {

    private final Command command;

    public LoggingCommand(
            Command command) {

        this.command = command;
    }

    @Override
    public void execute() {

        System.out.println(
            "Executing command"
        );

        command.execute();
    }
}
```

Structurally this is Decorator around Command.

Patterns are often combined in real systems.

---

# 49. Null Object Command

Suppose a remote button has no command assigned.

Instead of:

```java
if (command != null) {
    command.execute();
}
```

you can create:

```java
class NoOpCommand
        implements Command {

    @Override
    public void execute() {
    }
}
```

Then default:

```java
private Command command =
        new NoOpCommand();
```

Now:

```java
command.execute();
```

is always safe.

This is the **Null Object Pattern**, a useful smaller pattern outside the classic GoF 23.

---

# 50. Command and queue priority

Because commands are objects, you can assign priority:

```java
interface PrioritizedCommand
        extends Command {

    int priority();
}
```

Then a scheduler can use:

```java
PriorityQueue<PrioritizedCommand>
```

High-priority commands execute first.

Again, the invoker doesn't need to know command details.

---

# 51. Failure handling

Suppose a command throws:

```java
command.execute();
```

What should the invoker do?

Possibilities include:

```text
retry
mark failed
send to dead-letter queue
log
undo previous commands
alert operator
```

Command separates execution from scheduling, but failure policy still needs explicit design.

---

# 52. Undo is not always possible

A common misconception:

> Every Command must support undo.

No.

The basic Command interface can simply be:

```java
interface Command {

    void execute();
}
```

Undo is optional.

Some actions are hard or impossible to reverse:

```text
send email
external payment
delete remote resource
launch rocket
```

You may need compensation rather than true undo.

---

# 53. Compensation vs undo

Suppose:

```text
Charge card
```

You can't truly erase the historical charge.

Instead, compensation might be:

```text
Issue refund
```

So:

```text
undo
```

sometimes really means:

> Perform a compensating action.

This idea becomes very important later in distributed systems and Saga patterns.

---

# 54. Common mistake — Command class for every trivial call

Suppose:

```java
user.getName();
```

You probably don't need:

```text
GetUserNameCommand
```

Command adds value when actions need to be:

```text
decoupled
stored
scheduled
queued
undone
logged
retried
reused
```

Without one of those needs, direct method calls are often simpler.

---

# 55. Common mistake — business logic inside Invoker

Bad:

```java
class Button {

    public void click() {

        if (user.isPremium()) {
            ...
        }

        payment.charge();

        inventory.reserve();
    }
}
```

A generic invoker shouldn't absorb business logic.

Better:

```java
button.click()
    → command.execute()
```

The action logic belongs elsewhere.

---

# 56. Common mistake — giant command interface

Bad:

```java
interface Command {

    void execute();

    void undo();

    void redo();

    void serialize();

    void schedule();

    void validate();

    void audit();

    void retry();
}
```

Not every command needs all of those.

That's an ISP problem.

Keep the core interface focused.

Maybe:

```java
interface Command {
    void execute();
}
```

and specialized capabilities:

```java
interface UndoableCommand
        extends Command {

    void undo();
}
```

Much cleaner.

---

# 57. Common mistake — command knows too much

Bad:

```java
class PlaceOrderCommand {

    Database database;
    EmailService email;
    PaymentService payment;
    InventoryService inventory;
    HttpClient client;
    Logger logger;
    ...
}
```

Sometimes this is legitimate for application orchestration, but if the Command itself becomes a giant service, reconsider the design.

You may prefer:

```text
Command
→ request data

Handler
→ dependencies and execution
```

especially in larger systems.

---

# 58. Common mistake — confusing Command with DTO

A command is more than just arbitrary data.

A DTO like:

```java
record UserDto(
    String name,
    String email
) {}
```

represents data.

A command represents an intention:

```java
record RegisterUserCommand(
    String name,
    String email
) {}
```

That means:

> Please register this user.

Intent matters.

---

# 59. Recognition clues

Think Command when requirements say:

```text
"We need undo/redo."

"We need to queue operations."

"We want to schedule actions."

"We need command history."

"Buttons should trigger generic actions."

"We want to log requests."

"We need retries."

"We want to package a request and execute later."

"Different invokers should trigger the same action."
```

The strongest recognition question is:

> **Would it help if this action itself were an object?**

If yes, Command is a strong candidate.

---

# 60. Interview answer

If asked:

> What is the Command Pattern?

A strong answer is:

> Command is a behavioral design pattern that encapsulates a request as an object. A command usually contains the receiver and any parameters needed to perform the action, while an invoker triggers the command through a common interface such as `execute()`. This decouples the requester from the object performing the work and enables features such as queues, scheduling, logging, undo/redo, and command history.

Then give the remote-control example:

> A `RemoteControl` invokes `Command.execute()`, while `TurnOnLightCommand` delegates to a `Light` receiver.

---

# 61. Interview roles

If asked for the roles:

```text
Invoker
→ triggers action

Command
→ request abstraction

ConcreteCommand
→ specific request

Receiver
→ performs actual work
```

For our example:

```text
RemoteControl
→ Invoker

Command
→ Command

TurnOnLightCommand
→ ConcreteCommand

Light
→ Receiver
```

---

# 62. Strategy vs Observer vs Command

This is worth locking in.

### Strategy

```text
Question:
HOW should this behavior be performed?

Example:
CardPayment
PayPalPayment
CryptoPayment
```

### Observer

```text
Question:
WHO should be notified that something happened?

Example:
OrderPlaced
→ email
→ analytics
→ loyalty
```

### Command

```text
Question:
WHAT action should be performed?

Example:
PlaceOrder
CancelOrder
SendEmail
```

The shortcut:

```text
Strategy = HOW

Observer = WHO reacts

Command = WHAT to do
```

---

# 63. Command mental model

Remember:

```text
Invoker
   |
   | execute
   v
Command
   |
   | delegates
   v
Receiver
```

The Invoker says:

> Run this request.

The Command says:

> I know what request this represents.

The Receiver says:

> I know how to actually perform the work.

---

# Behavioral patterns so far

We've now covered:

```text
Strategy
→ interchangeable algorithms

Observer
→ notify interested listeners

Command
→ represent actions as objects
```

A compact mental model:

```text
Strategy = choose behavior

Observer = broadcast event

Command = package action
```

# Next: Lesson 22 — State Pattern

State is one of the most important patterns for LLD interviews because many systems naturally have lifecycles.

Imagine a vending machine:

```text
NoCoin
HasCoin
Dispensing
OutOfStock
```

If we write:

```java
if (state == NO_COIN) {
    ...
} else if (state == HAS_COIN) {
    ...
} else if (state == DISPENSING) {
    ...
}
```

for every operation:

```text
insertCoin()
selectItem()
dispense()
refund()
```

the class becomes a giant state machine full of conditionals.

State turns each state into an object:

```text
VendingMachine
      |
      v
State

NoCoinState
HasCoinState
DispensingState
OutOfStockState
```

and behavior changes when the machine changes its current State.

Lesson 22 will cover **State vs Strategy**, valid/invalid transitions, transition ownership, finite-state machines, order workflows, vending machines, and why State is extremely useful in LLD.
