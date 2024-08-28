#include "PhraseTypes.h"


std::regex combined_pattern{
    R"((\"(.*?)\")|(AND|OR|NOT)|([^\s"]+))",
    std::regex_constants::icase
};

// PhraseType StringToPhraseType(const std::string& string)
// {
//     if(std::regex_match(string,phrase_pattern)){
//         return PhraseType::PHRASE;
//     }
//     if(std::regex_match(string,logical_operations_pattern)){
//         return PhraseType::LOGICAL_OPERATION;
//     }
//     if(std::regex_match(string,other_pattern)){
//         return PhraseType::TERM;
//     }
    
//     return PhraseType();
// }

LogicalOperation GetLogicalOperation(const std::string string)
{
    std::regex and_pattern{R"(AND)", std::regex_constants::icase};
    std::regex or_pattern{R"(OR)", std::regex_constants::icase};
    std::regex not_pattern{R"(NOT)", std::regex_constants::icase};
    if(std::regex_match(string,and_pattern))return LogicalOperation::AND;
    if(std::regex_match(string,or_pattern))return LogicalOperation::OR;
    if(std::regex_match(string,not_pattern))return LogicalOperation::NOT;
    return LogicalOperation::OTHER;
}
