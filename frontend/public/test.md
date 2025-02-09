# Find Maximum and Minimum

## Description
Write a program to find the maximum and minimum values of a given list of integers. The program should handle specific constraints on the number of elements (`n`) and output the results on a single line.

## Input
The input consists of two lines:
1. An integer `n` (the number of elements in the list).
2. A single line containing `n` integers separated by a space.

### Constraints

```math
1 \leq n \leq 100
```

Each integer in the list satisfies
```math
10^6 \leq a_i \leq 10^6.
```

## Output
The output should be a single line containing two integers:
- The maximum value in the list.
- The minimum value in the list.

The integers should be separated by a single space.

## Example

### Input
```plaintext
4
1 2 3 4
```

### Output
```plaintext
4 1
```

## Note
Make sure your program can handle edge cases such as:
- All elements are the same.
- The list contains both very large positive and very small negative numbers.
