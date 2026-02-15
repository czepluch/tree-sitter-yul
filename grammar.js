/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

// EVM builtin opcodes recognized by the Yul compiler
const EVM_BUILTINS = [
  "stop",
  "add",
  "sub",
  "mul",
  "div",
  "sdiv",
  "mod",
  "smod",
  "exp",
  "not",
  "lt",
  "gt",
  "slt",
  "sgt",
  "eq",
  "iszero",
  "and",
  "or",
  "xor",
  "byte",
  "shl",
  "shr",
  "sar",
  "addmod",
  "mulmod",
  "signextend",
  "keccak256",
  "pop",
  "mload",
  "mstore",
  "mstore8",
  "sload",
  "sstore",
  "tload",
  "tstore",
  "msize",
  "gas",
  "address",
  "balance",
  "selfbalance",
  "caller",
  "callvalue",
  "calldataload",
  "calldatasize",
  "calldatacopy",
  "codesize",
  "codecopy",
  "extcodesize",
  "extcodecopy",
  "returndatasize",
  "returndatacopy",
  "mcopy",
  "extcodehash",
  "create",
  "create2",
  "call",
  "callcode",
  "delegatecall",
  "staticcall",
  "return",
  "revert",
  "selfdestruct",
  "invalid",
  "log0",
  "log1",
  "log2",
  "log3",
  "log4",
  "chainid",
  "basefee",
  "blobbasefee",
  "origin",
  "gasprice",
  "blockhash",
  "blobhash",
  "coinbase",
  "timestamp",
  "number",
  "difficulty",
  "prevrandao",
  "gaslimit",
  // Yul object-level builtins
  "datasize",
  "dataoffset",
  "datacopy",
  "setimmutable",
  "loadimmutable",
  "linkersymbol",
  "memoryguard",
];

module.exports = grammar({
  name: "yul",

  extras: ($) => [/\s/, $.comment],

  word: ($) => $.identifier,

  rules: {
    // A .yul file is either a top-level object or a bare block
    source_file: ($) =>
      repeat(choice($.object_definition, $.block, $.comment)),

    // --------------- Object notation ---------------

    object_definition: ($) =>
      seq(
        "object",
        field("name", $.string_literal),
        "{",
        $.code_section,
        repeat(choice($.object_definition, $.data_section)),
        "}",
      ),

    code_section: ($) => seq("code", $.block),

    data_section: ($) =>
      seq("data", field("name", $.string_literal), choice($.hex_literal, $.string_literal)),

    hex_literal: ($) =>
      seq("hex", choice(
        seq('"', field("value", optional(/([0-9a-fA-F]{2})*/)), '"'),
        seq("'", field("value", optional(/([0-9a-fA-F]{2})*/)), "'"),
      )),

    // --------------- Core Yul ---------------

    block: ($) => seq("{", repeat($.statement), "}"),

    statement: ($) =>
      choice(
        $.block,
        $.function_definition,
        $.variable_declaration,
        $.assignment,
        $.if_statement,
        $.switch_statement,
        $.for_statement,
        $.break_statement,
        $.continue_statement,
        $.leave_statement,
        $.expression_statement,
      ),

    function_definition: ($) =>
      seq(
        "function",
        field("name", $.identifier),
        "(",
        optional($.typed_identifier_list),
        ")",
        optional(seq("->", $.typed_identifier_list)),
        $.block,
      ),

    variable_declaration: ($) =>
      seq(
        "let",
        $.typed_identifier_list,
        optional(seq(":=", $.expression)),
      ),

    assignment: ($) =>
      seq($._identifier_list, ":=", $.expression),

    _identifier_list: ($) =>
      seq($.identifier, repeat(seq(",", $.identifier))),

    typed_identifier_list: ($) =>
      seq(
        $.identifier,
        optional(seq(":", $.type_name)),
        repeat(seq(",", $.identifier, optional(seq(":", $.type_name)))),
      ),

    expression_statement: ($) => $.expression,

    expression: ($) =>
      choice($.function_call, $.identifier, $.literal),

    function_call: ($) =>
      seq(
        field("function", choice($.evm_builtin, $.identifier)),
        "(",
        optional(seq($.expression, repeat(seq(",", $.expression)))),
        ")",
      ),

    // --------------- Control flow ---------------

    if_statement: ($) => seq("if", field("condition", $.expression), $.block),

    switch_statement: ($) =>
      seq(
        "switch",
        field("value", $.expression),
        choice(
          seq(repeat1($.case_clause), optional($.default_clause)),
          $.default_clause,
        ),
      ),

    case_clause: ($) =>
      seq("case", field("value", $.literal), $.block),

    default_clause: ($) => seq("default", $.block),

    for_statement: ($) =>
      seq(
        "for",
        field("init", $.block),
        field("condition", $.expression),
        field("update", $.block),
        field("body", $.block),
      ),

    break_statement: (_) => "break",
    continue_statement: (_) => "continue",
    leave_statement: (_) => "leave",

    // --------------- Literals ---------------

    literal: ($) =>
      choice(
        $.decimal_number,
        $.hex_number,
        $.string_literal,
        $.true,
        $.false,
      ),

    decimal_number: (_) => /[0-9]+/,

    hex_number: (_) => /0x[0-9a-fA-F]+/,

    string_literal: (_) =>
      seq('"', repeat(choice(/[^"\r\n\\]/, /\\./)), '"'),

    true: (_) => "true",
    false: (_) => "false",

    // --------------- Types ---------------

    type_name: (_) => /[a-zA-Z_$][a-zA-Z_$0-9]*/,

    // --------------- EVM builtins ---------------

    evm_builtin: (_) =>
      choice(
        ...EVM_BUILTINS,
        // verbatim_<n>i_<m>o pattern
        /verbatim_[0-9]+i_[0-9]+o/,
      ),

    // --------------- Identifiers ---------------

    identifier: (_) => /[a-zA-Z_$][a-zA-Z_$0-9.]*/,

    // --------------- Comments ---------------

    comment: (_) =>
      token(
        choice(
          seq("//", /[^\r\n]*/),
          seq("/*", /[^*]*\*+([^/*][^*]*\*+)*/, "/"),
        ),
      ),
  },
});
