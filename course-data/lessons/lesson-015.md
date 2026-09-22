# Lesson 15 — Composite Pattern

The **Composite Pattern** is used when you want to represent **part-whole hierarchies** such as trees, where individual objects and groups of objects should be treated through the same interface.

The core idea is:

> Treat a single object and a collection of similar objects uniformly.

A file system is the classic example.

You have:

```text
File
Folder
```

But a folder can contain:

```text
Files
Folders
```

and those folders can contain more files and folders.

So the structure becomes recursive:

```text
Root
├── photo.jpg
├── resume.pdf
└── Documents
    ├── report.docx
    └── Projects
        ├── app.java
        └── notes.txt
```

Now suppose we want:

```java
node.getSize();
```

to work for both a single file and an entire folder.

Composite solves exactly that.

---

# 1. Start with the problem

Suppose we model a file:

```java
class File {

    private String name;
    private long size;

    public File(
            String name,
            long size) {

        this.name = name;
        this.size = size;
    }

    public long getSize() {
        return size;
    }
}
```

Easy.

Now folder:

```java
class Folder {

    private String name;
    private List<File> files;

    public long getSize() {

        long total = 0;

        for (File file : files) {
            total += file.getSize();
        }

        return total;
    }
}
```

Still okay.

But folders can contain other folders.

So now:

```java
class Folder {

    private List<File> files;
    private List<Folder> folders;
}
```

Then:

```java
public long getSize() {

    long total = 0;

    for (File file : files) {
        total += file.getSize();
    }

    for (Folder folder : folders) {
        total += folder.getSize();
    }

    return total;
}
```

It works.

But notice something awkward.

The folder must separately understand:

```text
File
Folder
```

What happens if later we add:

```text
SymbolicLink
Archive
CloudFolder
Shortcut
```

The code becomes increasingly type-specific.

---

# 2. Find the common abstraction

Ask:

> What do both files and folders have in common from the caller's perspective?

They both represent:

> File system nodes.

And both can answer:

```java
getSize()
```

So let's create:

```java
interface FileSystemNode {

    long getSize();

    String getName();
}
```

Now both `File` and `Folder` can implement the same abstraction.

---

# 3. Leaf object

A single file is called a:

> **Leaf**

because it has no children.

```java
class File
        implements FileSystemNode {

    private final String name;
    private final long size;

    public File(
            String name,
            long size) {

        this.name = name;
        this.size = size;
    }

    @Override
    public long getSize() {
        return size;
    }

    @Override
    public String getName() {
        return name;
    }
}
```

Simple.

---

# 4. Composite object

A folder can contain other `FileSystemNode`s:

```java
class Folder
        implements FileSystemNode {

    private final String name;

    private final List<FileSystemNode>
            children =
            new ArrayList<>();

    public Folder(String name) {
        this.name = name;
    }

    public void add(
            FileSystemNode node) {

        children.add(node);
    }

    public void remove(
            FileSystemNode node) {

        children.remove(node);
    }

    @Override
    public long getSize() {

        long total = 0;

        for (FileSystemNode child
                : children) {

            total += child.getSize();
        }

        return total;
    }

    @Override
    public String getName() {
        return name;
    }
}
```

This is the Composite Pattern.

Notice:

```java
List<FileSystemNode>
```

not:

```java
List<File>
```

and not separate:

```java
List<File>
List<Folder>
```

A folder contains anything that implements:

```java
FileSystemNode
```

That includes:

```text
File
Folder
```

and potentially future node types.

---

# 5. Build a tree

Now:

```java
FileSystemNode photo =
        new File(
            "photo.jpg",
            500
        );

FileSystemNode resume =
        new File(
            "resume.pdf",
            200
        );
```

Create folder:

```java
Folder documents =
        new Folder(
            "Documents"
        );
```

Add files:

```java
documents.add(
    new File(
        "report.docx",
        300
    )
);
```

Create nested folder:

```java
Folder projects =
        new Folder(
            "Projects"
        );

projects.add(
    new File(
        "app.java",
        150
    )
);

projects.add(
    new File(
        "notes.txt",
        50
    )
);
```

Add folder inside folder:

```java
documents.add(projects);
```

Then root:

```java
Folder root =
        new Folder("Root");

root.add(photo);
root.add(resume);
root.add(documents);
```

Structure:

```text
Root
├── photo.jpg        500
├── resume.pdf       200
└── Documents
    ├── report.docx  300
    └── Projects
        ├── app.java 150
        └── notes.txt 50
```

Now:

```java
System.out.println(
    root.getSize()
);
```

returns:

```text
1200
```

The recursion happens naturally.

---

# 6. Why recursion works so beautifully

Look at the folder implementation:

```java
for (FileSystemNode child
        : children) {

    total += child.getSize();
}
```

The folder doesn't ask:

```java
if (child instanceof File) {
    ...
}

if (child instanceof Folder) {
    ...
}
```

It simply calls:

```java
child.getSize();
```

If the child is a file:

```text
return its own size
```

If the child is a folder:

```text
sum its children's sizes
```

Polymorphism handles the difference.

That's the elegance of Composite.

---

# 7. General structure

Composite usually has three important roles.

### Component

Common abstraction:

```java
interface Component {

    void operation();
}
```

### Leaf

Individual object:

```java
class Leaf
        implements Component {

    public void operation() {
        ...
    }
}
```

### Composite

Contains components:

```java
class Composite
        implements Component {

    private List<Component> children;

    public void operation() {

        for (Component child
                : children) {

            child.operation();
        }
    }
}
```

Visually:

```text
              Component
              /       \
             /         \
          Leaf      Composite
                       |
                       |
                       v
                List<Component>
```

The important recursive relationship is:

```text
Composite
contains
Component
```

and `Composite` itself is also a `Component`.

---

# 8. The key insight

A folder:

```text
IS-A FileSystemNode
```

and:

```text
HAS MANY FileSystemNodes
```

This recursive structure creates a tree.

Compare this with Decorator.

Decorator had:

```text
IS-A Component
HAS-A Component
```

Composite has:

```text
IS-A Component
HAS MANY Components
```

That's a useful distinction.

---

# 9. Another classic example — Organization chart

Imagine:

```text
CEO
├── Engineering Manager
│   ├── Developer
│   └── Developer
└── Sales Manager
    ├── Salesperson
    └── Salesperson
```

Suppose everyone has:

```java
double getSalaryCost();
```

An individual employee returns their salary.

A manager might return the total salary cost of their whole team.

We could define:

```java
interface EmployeeComponent {

    double getTotalCost();

    String getName();
}
```

Leaf:

```java
class Employee
        implements EmployeeComponent {

    private final String name;
    private final double salary;

    public Employee(
            String name,
            double salary) {

        this.name = name;
        this.salary = salary;
    }

    @Override
    public double getTotalCost() {
        return salary;
    }

    @Override
    public String getName() {
        return name;
    }
}
```

Composite:

```java
class Manager
        implements EmployeeComponent {

    private final String name;

    private final List<EmployeeComponent>
            reports =
            new ArrayList<>();

    public Manager(String name) {
        this.name = name;
    }

    public void add(
            EmployeeComponent employee) {

        reports.add(employee);
    }

    @Override
    public double getTotalCost() {

        double total = 0;

        for (EmployeeComponent employee
                : reports) {

            total +=
                employee.getTotalCost();
        }

        return total;
    }

    @Override
    public String getName() {
        return name;
    }
}
```

Again, the manager can contain:

```text
Employees
Managers
```

because both implement the same abstraction.

---

# 10. Product bundle example

Imagine an e-commerce system.

Single product:

```text
Laptop
Price = $1200
```

Bundle:

```text
Gaming Bundle
├── Laptop
├── Mouse
├── Keyboard
└── Streaming Bundle
    ├── Webcam
    └── Microphone
```

We want:

```java
item.getPrice();
```

to work for either a single product or a bundle.

Interface:

```java
interface Purchasable {

    double getPrice();

    String getName();
}
```

Leaf:

```java
class Product
        implements Purchasable {

    private final String name;
    private final double price;

    public Product(
            String name,
            double price) {

        this.name = name;
        this.price = price;
    }

    @Override
    public double getPrice() {
        return price;
    }

    @Override
    public String getName() {
        return name;
    }
}
```

Composite:

```java
class ProductBundle
        implements Purchasable {

    private final String name;

    private final List<Purchasable>
            items =
            new ArrayList<>();

    public ProductBundle(
            String name) {

        this.name = name;
    }

    public void add(
            Purchasable item) {

        items.add(item);
    }

    @Override
    public double getPrice() {

        double total = 0;

        for (Purchasable item
                : items) {

            total += item.getPrice();
        }

        return total;
    }

    @Override
    public String getName() {
        return name;
    }
}
```

Now callers don't care whether they receive:

```text
Product
ProductBundle
```

They only care about:

```java
Purchasable
```

---

# 11. UI tree example

Graphical interfaces naturally form trees.

```text
Window
├── Panel
│   ├── Button
│   ├── Label
│   └── Panel
│       └── Checkbox
└── Footer
```

Each UI element might support:

```java
void render();
```

A button renders itself.

A container renders all its children.

For example:

```java
interface UIComponent {

    void render();
}
```

Button:

```java
class Button
        implements UIComponent {

    @Override
    public void render() {
        System.out.println(
            "Rendering button"
        );
    }
}
```

Panel:

```java
class Panel
        implements UIComponent {

    private final List<UIComponent>
            children =
            new ArrayList<>();

    public void add(
            UIComponent component) {

        children.add(component);
    }

    @Override
    public void render() {

        System.out.println(
            "Rendering panel"
        );

        for (UIComponent child
                : children) {

            child.render();
        }
    }
}
```

Calling:

```java
window.render();
```

can recursively render the entire UI tree.

Very natural Composite usage.

---

# 12. Menu example

Menus are another common tree:

```text
File
├── New
├── Open
└── Recent
    ├── project1
    └── project2
```

Both:

```text
MenuItem
Menu
```

could implement:

```java
interface MenuComponent {

    void display();
}
```

A `MenuItem` displays itself.

A `Menu` displays itself and then recursively displays children.

Same pattern again.

---

# 13. Why Composite beats `instanceof`

Without Composite you might write:

```java
void printSize(Object object) {

    if (object instanceof File file) {

        System.out.println(
            file.getSize()
        );

    } else if (
        object instanceof Folder folder
    ) {

        long total = 0;

        for (...) {
            ...
        }
    }
}
```

Then every new tree-node type requires changing this logic.

With Composite:

```java
void printSize(
        FileSystemNode node) {

    System.out.println(
        node.getSize()
    );
}
```

Much simpler.

This supports OCP and polymorphism.

---

# 14. Composite makes clients simpler

Without Composite:

```text
Client must understand:
File
Folder
Nested Folder
Special Folder
Archive
...
```

With Composite:

```text
Client understands:
FileSystemNode
```

That's the major benefit:

> The client doesn't need separate logic for individual objects and groups.

---

# 15. Composite and recursion

You should associate Composite strongly with:

> **Recursive data structures**

A Composite often contains:

```java
List<Component>
```

Each of those components can itself be another Composite.

So we naturally get:

```text
Tree
```

This makes Composite especially useful for:

```text
file systems
organization hierarchies
menus
UI component trees
ASTs
category trees
product bundles
permissions
document structures
```

---

# 16. Composite and tree algorithms

Once you have a tree, many operations become recursive.

For example:

```java
interface FileSystemNode {

    long getSize();

    void print();
}
```

File:

```java
@Override
public void print() {

    System.out.println(name);
}
```

Folder:

```java
@Override
public void print() {

    System.out.println(name);

    for (FileSystemNode child
            : children) {

        child.print();
    }
}
```

Calling:

```java
root.print();
```

prints the entire tree.

The caller doesn't perform the recursion.

The tree objects themselves do.

---

# 17. Adding indentation

Suppose we want:

```text
Root
  photo.jpg
  Documents
    report.docx
    Projects
      app.java
```

One approach:

```java
interface FileSystemNode {

    void print(String indent);
}
```

File:

```java
public void print(
        String indent) {

    System.out.println(
        indent + name
    );
}
```

Folder:

```java
public void print(
        String indent) {

    System.out.println(
        indent + name
    );

    for (FileSystemNode child
            : children) {

        child.print(
            indent + "  "
        );
    }
}
```

Again, recursion naturally follows the object hierarchy.

---

# 18. Transparent Composite

There are two common design styles.

One style puts child-management methods on the shared interface:

```java
interface FileSystemNode {

    long getSize();

    void add(FileSystemNode node);

    void remove(FileSystemNode node);
}
```

Then both:

```text
File
Folder
```

implement everything.

But what does `File.add()` mean?

Probably nothing.

You might end up with:

```java
class File
        implements FileSystemNode {

    @Override
    public void add(
            FileSystemNode node) {

        throw new
            UnsupportedOperationException();
    }
}
```

This style is sometimes called:

> **Transparent Composite**

because clients can treat all components identically, including child operations.

But it creates a potential LSP/ISP problem.

---

# 19. Safe Composite

Another approach keeps child-management operations only on composite types.

Component:

```java
interface FileSystemNode {

    long getSize();
}
```

Leaf:

```java
class File
        implements FileSystemNode {
    ...
}
```

Composite:

```java
class Folder
        implements FileSystemNode {

    public void add(
            FileSystemNode node) {
        ...
    }
}
```

Now `File` isn't forced to implement meaningless:

```java
add()
remove()
```

This is often called:

> **Safe Composite**

The tradeoff is that clients need to know they have a `Folder` if they want to modify children.

---

# 20. Transparent vs safe

Transparent:

```text
Component
├── operation()
├── add()
└── remove()
```

Pros:

```text
uniform API
```

Cons:

```text
leaf objects may expose meaningless methods
```

Safe:

```text
Component
└── operation()

Composite
├── add()
└── remove()
```

Pros:

```text
better type safety
cleaner contracts
```

Cons:

```text
less uniform child-management API
```

In Java, I generally prefer the **safe version** unless uniform tree manipulation is genuinely important.

---

# 21. Connection to ISP

Remember Interface Segregation Principle:

> Don't force clients or implementations to depend on methods they don't need.

If we put:

```java
add()
remove()
```

on every component, leaf objects may be forced to implement operations they don't support.

That's an ISP smell.

So SOLID reasoning helps us choose between Composite variants.

---

# 22. Connection to LSP

Suppose:

```java
FileSystemNode node =
        new File(...);
```

If the interface promises:

```java
node.add(...)
```

but `File.add()` throws:

```java
UnsupportedOperationException
```

the subtype isn't really honoring the abstraction well.

That's the same LSP issue we learned earlier.

Again, design patterns and SOLID are connected.

---

# 23. Composite vs Decorator

This comparison is important because structurally they look similar.

Decorator:

```text
Component
  ^
  |
Decorator
  |
  v
one Component
```

Composite:

```text
Component
  ^
  |
Composite
  |
  v
many Components
```

Decorator:

> Adds behavior around one wrapped object.

Composite:

> Represents a group of objects as one object.

So:

```text
Decorator
→ one child, enhancement

Composite
→ many children, hierarchy
```

---

# 24. Composite vs Facade

Facade:

> Provides a simpler interface over a subsystem.

Composite:

> Represents individual objects and groups uniformly.

Facade doesn't usually create recursive structures.

Composite does.

Example:

```text
Facade:
CheckoutFacade
  → Payment
  → Inventory
  → Shipping
```

versus:

```text
Composite:
Folder
  → File
  → Folder
      → File
```

Different intents.

---

# 25. Composite vs Chain of Responsibility

Both can form linked structures, but they differ.

Composite usually forms a:

```text
tree
```

Chain of Responsibility usually forms a:

```text
sequence
```

Composite typically processes children recursively.

Chain typically passes a request from handler to handler.

We'll cover Chain later.

---

# 26. Composite vs Iterator

Composite stores hierarchical structures.

Iterator provides a way to traverse collections without exposing their internals.

They are often used together.

For example:

```text
Composite
→ represents file tree

Iterator
→ traverses files in DFS/BFS order
```

We'll study Iterator later in behavioral patterns.

---

# 27. Composite and Visitor

Another future pattern pairs naturally with Composite.

Suppose we have:

```text
File
Folder
SymbolicLink
Archive
```

and many operations:

```text
calculate size
serialize
scan for malware
export metadata
calculate permissions
```

Putting every operation on every node can become messy.

Visitor can move some operations outside the tree objects.

So:

```text
Composite
→ object structure

Visitor
→ operations over that structure
```

We'll return to this later.

---

# 28. Another example — arithmetic expression tree

Suppose we want to represent:

```text
(5 + 3) * 2
```

Tree:

```text
      *
     / \
    +   2
   / \
  5   3
```

Define:

```java
interface Expression {

    int evaluate();
}
```

Leaf:

```java
class NumberExpression
        implements Expression {

    private final int value;

    public NumberExpression(
            int value) {

        this.value = value;
    }

    @Override
    public int evaluate() {
        return value;
    }
}
```

Composite:

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
    public int evaluate() {

        return left.evaluate()
                + right.evaluate();
    }
}
```

Another composite:

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
    public int evaluate() {

        return left.evaluate()
                * right.evaluate();
    }
}
```

Build:

```java
Expression expression =
        new MultiplyExpression(
            new AddExpression(
                new NumberExpression(5),
                new NumberExpression(3)
            ),
            new NumberExpression(2)
        );
```

Then:

```java
System.out.println(
    expression.evaluate()
);
```

returns:

```text
16
```

This is also Composite thinking.

---

# 29. Composite isn't limited to collections

Notice that `AddExpression` has exactly two children:

```java
left
right
```

It doesn't need:

```java
List<Component>
```

The essential property is:

> A composite contains other objects of the same abstraction.

So trees can be:

```text
binary
n-ary
fixed-arity
variable-arity
```

and still use Composite principles.

---

# 30. Example — permissions

Imagine:

```text
Permission
```

or:

```text
PermissionGroup
```

A group may contain individual permissions and other groups.

```java
interface PermissionNode {

    boolean allows(
        String permission
    );
}
```

Single permission:

```java
class Permission
        implements PermissionNode {

    private final String name;

    public boolean allows(
            String permission) {

        return name.equals(
            permission
        );
    }
}
```

Group:

```java
class PermissionGroup
        implements PermissionNode {

    private final List<PermissionNode>
            children =
            new ArrayList<>();

    public boolean allows(
            String permission) {

        for (PermissionNode child
                : children) {

            if (child.allows(
                    permission)) {

                return true;
            }
        }

        return false;
    }
}
```

Again:

```text
single thing
group of things
same abstraction
```

That's Composite.

---

# 31. Composite and caching

Suppose calculating a folder size is expensive because the tree contains millions of nodes.

You could cache:

```java
private Long cachedSize;
```

But now you need to invalidate the cache whenever:

```text
child added
child removed
child changed
```

This is not a problem with the Composite pattern itself, but it's an important practical issue in large mutable trees.

Tree structures can make aggregate operations expensive.

---

# 32. Mutable vs immutable composites

Mutable:

```java
folder.add(file);
folder.remove(file);
```

Easy to modify.

But concurrency and caching become harder.

Immutable:

```java
new Folder(
    "Documents",
    List.of(
        file1,
        file2
    )
);
```

Safer and easier to reason about.

But modifications require creating new structures.

The right choice depends on your domain.

Composite doesn't require one or the other.

---

# 33. Avoid cycles

Composite normally represents trees.

But nothing technically prevents you from doing something like:

```java
folderA.add(folderB);
folderB.add(folderA);
```

Now:

```java
folderA.getSize();
```

can recurse forever.

So if cycles are invalid in your domain, you may need to prevent them.

For example:

```text
tree
good

general graph with cycles
requires additional safeguards
```

That's an important practical concern.

---

# 34. Parent references

Sometimes nodes need to know their parent:

```java
class Folder {

    private Folder parent;
}
```

This can help with:

```text
navigation
path generation
permissions
removal
```

For example:

```java
node.getPath()
```

could produce:

```text
/root/documents/projects/app.java
```

But parent references also introduce bidirectional relationships and can complicate mutation.

Again, this is an implementation decision rather than a requirement of Composite.

---

# 35. Full file-system example

Here's a compact version:

```java
interface FileSystemNode {

    String getName();

    long getSize();

    void print(String indent);
}
```

Leaf:

```java
class File
        implements FileSystemNode {

    private final String name;
    private final long size;

    public File(
            String name,
            long size) {

        this.name = name;
        this.size = size;
    }

    @Override
    public String getName() {
        return name;
    }

    @Override
    public long getSize() {
        return size;
    }

    @Override
    public void print(
            String indent) {

        System.out.println(
            indent
            + name
            + " ("
            + size
            + ")"
        );
    }
}
```

Composite:

```java
class Folder
        implements FileSystemNode {

    private final String name;

    private final List<FileSystemNode>
            children =
            new ArrayList<>();

    public Folder(String name) {
        this.name = name;
    }

    public void add(
            FileSystemNode node) {

        children.add(node);
    }

    public void remove(
            FileSystemNode node) {

        children.remove(node);
    }

    @Override
    public String getName() {
        return name;
    }

    @Override
    public long getSize() {

        long total = 0;

        for (FileSystemNode child
                : children) {

            total += child.getSize();
        }

        return total;
    }

    @Override
    public void print(
            String indent) {

        System.out.println(
            indent + name + "/"
        );

        for (FileSystemNode child
                : children) {

            child.print(
                indent + "  "
            );
        }
    }
}
```

Usage:

```java
Folder root =
        new Folder("root");

root.add(
    new File(
        "photo.jpg",
        500
    )
);

Folder documents =
        new Folder(
            "documents"
        );

documents.add(
    new File(
        "resume.pdf",
        200
    )
);

Folder projects =
        new Folder(
            "projects"
        );

projects.add(
    new File(
        "Main.java",
        100
    )
);

documents.add(projects);

root.add(documents);

root.print("");

System.out.println(
    "Total size: "
    + root.getSize()
);
```

The important part is that `root` doesn't care whether its children are leaves or composites.

---

# 36. How Composite supports OCP

Suppose we add:

```java
class SymbolicLink
        implements FileSystemNode {
    ...
}
```

Existing folder logic:

```java
for (FileSystemNode child
        : children) {

    total += child.getSize();
}
```

doesn't need to change as long as `SymbolicLink` honors the component contract.

That's OCP.

---

# 37. Composite and LSP

A client can receive:

```java
FileSystemNode node;
```

Then:

```java
node.getSize();
```

should work correctly whether `node` is:

```text
File
Folder
Archive
SymbolicLink
```

That's exactly LSP.

Composite heavily relies on trustworthy polymorphism.

---

# 38. Composite and SRP

Leaf:

```text
represents individual object
```

Composite:

```text
manages children and aggregate behavior
```

Client:

```text
uses common abstraction
```

Responsibilities remain reasonably separated.

---

# 39. Common mistake: too much logic in Composite

Suppose `Folder` starts handling:

```text
database persistence
permissions
file compression
cloud upload
notifications
billing
```

Now we're no longer just modeling the hierarchy.

Those concerns probably deserve separate services or patterns.

Composite should focus on hierarchical object relationships and operations that make sense recursively.

---

# 40. Common mistake: using Composite without a real hierarchy

If your objects don't form a meaningful tree or part-whole structure, Composite may add unnecessary complexity.

For example:

```text
User
Payment
Email
Database
```

aren't automatically a Composite just because they're related.

Composite is specifically useful when:

> Groups contain elements that can themselves be groups.

That recursive relationship is the key.

---

# 41. Recognition clues

Think Composite when requirements say:

```text
"Folders contain files and folders."

"Managers contain employees and managers."

"Menus contain items and submenus."

"UI containers contain controls and other containers."

"Bundles contain products and other bundles."

"Categories contain products and subcategories."

"We want the same operation to work
on one item or an entire group."
```

The strongest clue is:

> **A group and an individual should be treated through the same abstraction.**

---

# 42. Interview answer

If an interviewer asks:

> What is the Composite Pattern?

A strong answer is:

> Composite is a structural design pattern used to represent tree-like part-whole hierarchies. It defines a common component abstraction so that individual objects and groups of objects can be treated uniformly. Composite objects contain other components and usually delegate or aggregate operations recursively.

Then give the file-system example:

> A `File` and `Folder` can both implement `FileSystemNode`. A file returns its own size, while a folder sums the sizes of its child nodes, which may themselves be files or folders.

That's a very strong answer.

---

# 43. Mental model

Remember:

```text
Component
   |
   +------ Leaf
   |
   +------ Composite
             |
             +--> Component
             +--> Component
             +--> Component
```

And the simplest recognition rule:

```text
Leaf
→ single object

Composite
→ group of Components

Both
→ same abstraction
```

---

# Structural patterns so far

We've now covered four:

```text
Adapter
→ Make incompatible interfaces work together.

Decorator
→ Add behavior dynamically through wrapping.

Facade
→ Simplify access to a complex subsystem.

Composite
→ Treat individual objects and groups uniformly.
```

A quick memory model:

```text
Adapter   = translate
Decorator = enhance
Facade    = simplify
Composite = tree
```

# Next: Lesson 16 — Proxy Pattern

Proxy looks deceptively similar to Decorator because both wrap another object.

Suppose your application has:

```java
interface Image {

    void display();
}
```

Loading a large image from disk is expensive.

You don't want this:

```java
new RealImage("huge-photo.jpg");
```

to immediately load 500 MB of data if the image may never be displayed.

A **Proxy** can stand in front of it:

```text
Client
  ↓
Image
  ↑
ImageProxy
  ↓
RealImage
```

The proxy may create the real object only when needed.

Proxy can also handle:

```text
lazy loading
authorization
caching
remote calls
access control
logging
rate limiting
```

Lesson 16 will focus on **Proxy vs Decorator**, because they often have nearly identical class diagrams but very different intentions.
