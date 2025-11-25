#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
약품 정보 크롤링 및 NBSP 문자 자동 정리 통합 스크립트
크롤링 완료 후 자동으로 NBSP 문자를 일반 공백으로 변환하고 백업 파일을 삭제합니다.
"""

import requests
from bs4 import BeautifulSoup
import csv
import os
import json
import re
from pathlib import Path
import pandas as pd

def clean_text(text):
    """HTML 태그 및 특수 문자 정리"""
    if not text:
        return ''
    
    # 기본적인 HTML 태그 변환
    text = text.replace('<br>', '\n').replace('&nbsp;', ' ').strip()
    
    # BeautifulSoup으로 모든 HTML 태그 제거
    soup = BeautifulSoup(text, 'html.parser')
    clean_content = soup.get_text(separator=' ').strip()
    
    # 연속된 공백을 하나의 공백으로 정리
    clean_content = re.sub(r'\s+', ' ', clean_content)
    
    return clean_content

def parse_drug_name(original_name):
    """
    품목명을 파싱하여 품목명과 용량으로 분리합니다.
    
    Args:
        original_name (str): 원본 품목명
    
    Returns:
        dict: {'품목명': str, '용량': str}
    """
    if not original_name or pd.isna(original_name):
        return {'품목명': '', '용량': ''}
    
    name = str(original_name).strip()
    
    # 1. "(수출용)" 포함된 경우 원본 그대로 반환
    if "(수출용)" in name:
        return {'품목명': name, '용량': ''}
    
    # 2. 괄호를 모두 제거한 기본 이름
    bracket_pattern = r'\([^)]*\)'
    base_name = re.sub(bracket_pattern, '', name).strip()
    
    # 3. 용량 단위 패턴 정의 (긴 단위부터 먼저 매칭되도록 정렬)
    dosage_units = [
        '마이크로그람', '마이크로그램',  # 마이크로 단위
        '밀리그람', '밀리그램', '미리그람', '밀리그',  # 밀리 단위 (한글)
        '그람', '그램',  # 그램 단위 (한글)
        'mcg', 'μg', 'mg', 'g',  # 영문/기호 단위
        'ML', 'ml', 'mL',  # 액체 단위 추가
        'IU', 'iu'  # 국제단위 추가
    ]
    
    # 용량 패턴: 숫자(소수점, / 포함 가능) + 단위
    # 예: 150밀리그램, 80/12.5밀리그램, 40mg 등
    dosage_pattern = r'([0-9]+(?:\.[0-9]+)?(?:/[0-9]+(?:\.[0-9]+)?)*)\s*(' + '|'.join(re.escape(unit) for unit in dosage_units) + r')'
    
    dosage_match = re.search(dosage_pattern, base_name, re.IGNORECASE)
    
    if dosage_match:
        # 용량 정보 추출
        dosage_value = dosage_match.group(1)
        dosage_unit = dosage_match.group(2)
        dosage = f"{dosage_value}{dosage_unit}"
        
        # 용량 부분을 제거한 나머지가 품목명
        drug_name = base_name[:dosage_match.start()].strip()
        if not drug_name:  # 품목명이 비어있으면 전체를 품목명으로
            drug_name = base_name
            dosage = ""
    else:
        # 용량 정보가 없는 경우
        drug_name = base_name
        dosage = ""
    
    return {
        '품목명': drug_name,
        '용량': dosage
    }

def crawl_drug_info(drug_cd):
    """약품 정보 크롤링"""
    url = f"https://www.health.kr/searchDrug/result_drug.asp?drug_cd={drug_cd}"
    ajax_url = f"https://www.health.kr/searchDrug/ajax/ajax_result_drug2.asp?drug_cd={drug_cd}"

    drug_name_text = ''
    ingredient_text = ''
    dur_text = ''
    medication_guide_text = ''
    try:
        # Fetch drug name and ingredient info from AJAX URL
        ajax_response = requests.get(ajax_url)
        ajax_response.raise_for_status()
        ajax_data = json.loads(ajax_response.text)
        if ajax_data and len(ajax_data) > 0:
            if 'drug_name' in ajax_data[0]:
                drug_name_text = ajax_data[0]['drug_name']
            if 'sunb' in ajax_data[0]:
                # sunb 필드에서 성분 정보 추출 및 정리
                raw_ingredient = ajax_data[0]['sunb']
                # HTML 태그 및 특수 문자 제거
                ingredient_text = clean_text(raw_ingredient.replace('@', '').replace('</a>', ''))
            
            # DUR 정보 수집
            dur_fields = ['dur_age', 'dur_contra', 'dur_preg', 'dur_senior', 'dur_dose', 'dur_period', 'dur_donate', 'dur_form']
            dur_info = []
            for field in dur_fields:
                if field in ajax_data[0] and ajax_data[0][field] and ajax_data[0][field].strip():
                    field_name = {
                        'dur_age': '[연령주의]',
                        'dur_contra': '[금기]', 
                        'dur_preg': '[임부주의]',
                        'dur_senior': '[고령자주의]',
                        'dur_dose': '[용량주의]',
                        'dur_period': '[투여기간주의]',
                        'dur_donate': '[헌혈주의]',
                        'dur_form': '[제형주의]'
                    }.get(field, f'[{field}]')
                    # HTML 태그 제거 및 텍스트 정리
                    cleaned_dur_text = clean_text(ajax_data[0][field])
                    dur_info.append(f"{field_name} {cleaned_dur_text}")
            
            dur_text = ', '.join(dur_info) if dur_info else ''
            
            # 복약정보 수집 (mediguide 필드)
            if 'mediguide' in ajax_data[0] and ajax_data[0]['mediguide']:
                medication_guide_text = clean_text(ajax_data[0]['mediguide'].replace('brbr', '\n').replace('<br>', '\n'))

        # Fetch main page content for other details
        response = requests.get(url)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data for {drug_cd}: {e}")
        return None, None, None, None, None, None, None

    soup = BeautifulSoup(response.text, 'html.parser')

    effect = soup.find('div', id='tab_effect')
    dosage = soup.find('div', id='tab_dosage')
    caution = soup.find('div', id='tab_caution')

    effect_text = clean_text(str(effect)) if effect else ''
    dosage_text = clean_text(str(dosage)) if dosage else ''
    caution_text = clean_text(str(caution)) if caution else ''

    return drug_name_text, ingredient_text, dur_text, effect_text, dosage_text, caution_text, medication_guide_text

def fix_nbsp_in_csv(input_file, auto_cleanup=True):
    """
    CSV 파일의 NBSP 문자를 일반 공백으로 변환
    
    Args:
        input_file (str): 입력 CSV 파일 경로
        auto_cleanup (bool): 성공 후 백업 파일 자동 삭제 여부
    
    Returns:
        bool: 성공 여부
    """
    input_path = Path(input_file)
    
    if not input_path.exists():
        print(f"파일을 찾을 수 없습니다: {input_file}")
        return False
    
    # 백업 파일 생성
    backup_file = input_path.with_suffix('.bak')
    
    # 기존 백업 파일이 있으면 삭제
    if backup_file.exists():
        backup_file.unlink()
        print(f"기존 백업 파일 삭제: {backup_file}")
    
    print(f"백업 파일 생성: {backup_file}")
    input_path.rename(backup_file)
    
    try:
        with open(backup_file, 'r', encoding='utf-8') as infile:
            content = infile.read()
        
        # NBSP 문자들을 일반 공백으로 변환
        # \u00A0: Non-breaking space (UTF-8)
        # \u2007: Figure space
        # \u2008: Punctuation space
        # \u2009: Thin space
        # \u200A: Hair space
        # \u202F: Narrow no-break space
        # \u205F: Medium mathematical space
        content = re.sub(r'[\u00A0\u2007\u2008\u2009\u200A\u202F\u205F]', ' ', content)
        
        # 연속된 공백들을 하나의 공백으로 정리
        content = re.sub(r' +', ' ', content)
        
        # 각 필드의 앞뒤 공백 제거 (단, CSV 구조 유지)
        lines = content.split('\n')
        cleaned_lines = []
        
        for line in lines:
            if line.strip():  # 빈 줄이 아닌 경우
                # CSV 필드 분리 후 각 필드의 앞뒤 공백 제거
                fields = []
                in_quotes = False
                current_field = ""
                
                for char in line:
                    if char == '"':
                        in_quotes = not in_quotes
                        current_field += char
                    elif char == ',' and not in_quotes:
                        fields.append(current_field.strip())
                        current_field = ""
                    else:
                        current_field += char
                
                # 마지막 필드 추가
                if current_field:
                    fields.append(current_field.strip())
                
                # 필드들을 다시 조합
                cleaned_line = ','.join(fields)
                cleaned_lines.append(cleaned_line)
        
        # 파일 저장
        with open(input_file, 'w', encoding='utf-8', newline='') as outfile:
            outfile.write('\n'.join(cleaned_lines))
        
        print(f"NBSP 문자 변환 완료: {input_file}")
        
        # 백업 파일 자동 삭제
        if auto_cleanup and backup_file.exists():
            try:
                backup_file.unlink()
                print(f"백업 파일 삭제 완료: {backup_file}")
            except Exception as e:
                print(f"백업 파일 삭제 실패: {e}")
        
        return True
        
    except Exception as e:
        print(f"NBSP 변환 오류 발생: {e}")
        # 오류 시 원본 파일 복구
        if backup_file.exists():
            backup_file.rename(input_path)
            print(f"원본 파일 복구 완료: {input_file}")
        return False

def main():
    """메인 실행 함수"""
    csv_file_path = '../data/medicine_detail_info.csv'
    temp_csv_file_path = '../data/medicine_detail_info_temp.csv'

    # 사용자 입력 받기
    print("=== 약품 정보 크롤링 스크립트 ===")
    print("옵션을 선택하세요:")
    print("1. Enter/빈 입력: 기존 데이터가 있는 경우 건너뛰기 (기본값)")
    print("2. 'overwrite' 또는 'o': 기존 데이터가 있어도 강제로 덮어쓰기")
    print("3. 'force' 또는 'f': 모든 데이터를 강제로 새로 크롤링")
    
    user_input = input("입력하세요: ").strip().lower()
    
    # 덮어쓰기 모드 결정
    if user_input in ['overwrite', 'o']:
        overwrite_mode = 'overwrite'
        print("🔄 덮어쓰기 모드: 기존 데이터가 있어도 새로 크롤링합니다.")
    elif user_input in ['force', 'f']:
        overwrite_mode = 'force'
        print("🚀 강제 모드: 모든 데이터를 새로 크롤링합니다.")
    else:
        overwrite_mode = 'skip'
        print("⏭️ 건너뛰기 모드: 기존 데이터가 있는 경우 건너뜁니다.")
    
    print()

    drug_cds = []
    existing_data = []

    # Read existing data and drug_cds from the CSV
    if os.path.exists(csv_file_path):
        with open(csv_file_path, 'r', encoding='utf-8', newline='') as infile:
            reader = csv.reader(infile)
            header = next(reader)  # Read header
            for row in reader:
                drug_cds.append(row[0])
                existing_data.append(row)
    else:
        print(f"Error: {csv_file_path} not found.")
        return

    print(f"총 {len(drug_cds)}개의 약품 코드를 처리합니다.")

    # Prepare data for writing
    new_rows = []
    processed_count = 0
    skipped_count = 0
    
    for i, drug_cd in enumerate(drug_cds):
        # Ensure current_row has enough columns before processing (9 columns for medicine_detail_info.csv)
        current_row = existing_data[i] if i < len(existing_data) else [drug_cd]
        while len(current_row) < 9: # Ensure it has all 9 columns
            current_row.append('')

        # 기존 데이터 존재 여부 확인 및 모드에 따른 처리
        data_exists = current_row[1]  # 제품명 (index 1)이 있는지 확인
        
        if data_exists and overwrite_mode == 'skip':
            new_rows.append(current_row)
            print(f"[{i+1}/{len(drug_cds)}] Skipping {drug_cd}: Data already exists.")
            skipped_count += 1
            continue
        elif data_exists and overwrite_mode == 'overwrite':
            print(f"[{i+1}/{len(drug_cds)}] Overwriting {drug_cd}: Existing data will be replaced.")
        elif overwrite_mode == 'force':
            print(f"[{i+1}/{len(drug_cds)}] Force crawling {drug_cd}: All data will be refreshed.")
        else:
            print(f"[{i+1}/{len(drug_cds)}] Crawling new data for {drug_cd}: No existing data found.")

        drug_name, ingredient, dur_info, effect, dosage, caution, medication_guide = crawl_drug_info(drug_cd)
        
        if drug_name:
            # 제품명 파싱하여 제품명과 용량 분리
            parsed_name = parse_drug_name(drug_name)
            parsed_drug_name = parsed_name['품목명']
            parsed_dosage = parsed_name['용량']
            
            # Update the specific columns
            # 컬럼 매핑: 0=고유코드, 1=제품명, 2=성분, 3=용량, 4=의약품안정성정보(DUR), 5=효능및효과, 6=용법및용량, 7=사용상의주의사항, 8=복약정보
            current_row[1] = parsed_drug_name  # 제품명 (파싱된 깨끗한 이름)
            current_row[2] = ingredient        # 성분
            current_row[3] = parsed_dosage     # 용량 (파싱해서 추출된 용량)
            current_row[4] = dur_info          # 의약품안정성정보(DUR)
            current_row[5] = effect            # 효능및효과
            current_row[6] = dosage            # 용법및용량
            current_row[7] = caution           # 사용상의주의사항
            current_row[8] = medication_guide  # 복약정보
            processed_count += 1
            print(f"[OK] Successfully crawled: {parsed_drug_name} - {ingredient}")
            if parsed_dosage:
                print(f"     용량: {parsed_dosage}")
            if dur_info:
                print(f"     DUR: {dur_info[:100]}..." if len(dur_info) > 100 else f"     DUR: {dur_info}")
            if medication_guide:
                print(f"     복약정보: {medication_guide[:100]}..." if len(medication_guide) > 100 else f"     복약정보: {medication_guide}")
        else:
            print(f"[FAIL] Failed to crawl data for: {drug_cd}")
        
        new_rows.append(current_row)

    # Write all data (header + new_rows) to a temporary CSV file
    with open(temp_csv_file_path, 'w', encoding='utf-8', newline='') as outfile:
        writer = csv.writer(outfile)
        writer.writerow(header)
        writer.writerows(new_rows)

    # Replace the original CSV file with the temporary one
    os.replace(temp_csv_file_path, csv_file_path)
    
    print(f"\n=== 크롤링 완료 ===")
    print(f"처리된 약품: {processed_count}개")
    print(f"건너뛴 약품: {skipped_count}개")
    print(f"데이터가 {csv_file_path}에 저장되었습니다.")

    # 크롤링 완료 후 NBSP 문자 자동 정리
    print(f"\n=== NBSP 문자 자동 정리 시작 ===")
    if fix_nbsp_in_csv(csv_file_path):
        print("[SUCCESS] 모든 작업이 성공적으로 완료되었습니다!")
    else:
        print("[ERROR] NBSP 정리 과정에서 오류가 발생했습니다.")
        print("크롤링은 정상적으로 완료되었으나, 수동으로 fix_nbsp.py를 실행해주세요.")

if __name__ == "__main__":
    main()