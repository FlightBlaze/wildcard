<img width="611" alt="wildcard" src="https://github.com/FlightBlaze/wildcard/assets/18074076/eba77db2-12d0-4f44-a535-a51e796baa0a">
<p></p>
<p></p>
<p></p>

The functional programming language. Simple and practical. Featuring eye-candy syntax without semicolons or even commas

## Example

fibonacci.w:
```
range(0 n) map([+1]) reduce([+it])
```

index.w
```
print('Fibonacci number is '+fibonacci(n=5))
```

Output:
```
Fibonacci number is 21
```

## When complex makes things easy
Introducing `complex` — a straightforward way to organize your data structures. It acts as an `array`, a `hashmap`, and like something in-between. You can use familiar functions like `map` and `reduce` on a `complex`
```
fib = complex(about='This is Fibonacci sequence' 0 1 1 2 3 5 8 13 21)
print(fib.about)
```

### Installation with command line

```
git clone https://github.com/FlightBlaze/wildcard.git
cd wildcard
npm i
npm run w
```

### Requirements

- Node.js 18.x or higher
- npm


<p></p>
<p></p>
<p></p>
<img width="632" alt="pattern of green stars with the wildcard logo" src="https://github.com/FlightBlaze/wildcard/assets/18074076/fddc8c30-b696-4dcd-8b2a-5bf7f4a4ae6c">
