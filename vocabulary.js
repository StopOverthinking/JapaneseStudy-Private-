const vocabularySets = [];
let allVocabulary = []; // const에서 let으로 변경하여 재할당 가능하게 함

// 각 단어장 파일에서 이 함수를 호출하여 데이터를 등록합니다.
function registerVocabularySet(set) {
    vocabularySets.push(set);
}
